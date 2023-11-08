import { Request, Response as ExpressResponse, Router } from 'express';
import prisma from './database';
import Messenger from './mailer';
import { SubscriptionPeriodEnum, SubscriptionStatusEnum, SubscriptionTypeEnum } from '@prisma/client';
import { stripe } from '../servers/main';
import { generateCUID } from '../helper';

export async function handleCharge(event: Request['body']) {
    if (event.data.object.payment_status !== 'paid') return false;
    if (!event.data.object.customer_details.email) return false;
    const planType = await prisma.subscriptionType.findUnique({
        where: {
            externalId: event.data.object.payment_link
        }
    })
    if (!planType) throw new Error('Plan not found');
    // get user most recent event by email address and get isPaid attribute is false
    const user = await prisma.user.findUnique({
        where: {
            email: event.data.object.customer_details.email,
        }
    });
    if (!user) throw new Error('Event not found');
    await prisma.subscription.create({
        data: {
            id: generateCUID('sub'),
            status: SubscriptionStatusEnum.ACTIVE,
            externalId: event.data.object.subscription,
            User: {
                connect: {
                    id: user.id,
                }
            },
            SubscriptionType: {
                connect: {
                    id: planType.id,
                }
            },
            createdAt: new Date(),
        }
    })
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            isActive: true,
        }
    })

    return true;
}

export const checkSubscription = async (stripeId: string) => {
    const subscription = await stripe.subscriptions.retrieve(stripeId);
    if (subscription.status === 'active') return true;
    const sub = await prisma.subscription.update({
        where: {
            externalId: stripeId,
            status: SubscriptionStatusEnum.ACTIVE
        },
        data: {
            status: SubscriptionStatusEnum.INACTIVE
        }
    })
    await prisma.user.update({
        where: {
            id: sub.userId,
        },
        data: {
            isActive: false,
        }
    })

    return false;
}