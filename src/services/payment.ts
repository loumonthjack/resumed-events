import { Request, Response as ExpressResponse, Router } from 'express';
import prisma from './database';
import Messenger from './mailer';
import { SubscriptionPeriodEnum, SubscriptionStatusEnum, SubscriptionTypeEnum, SupportPriorityEnum } from '@prisma/client';

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
            status: SubscriptionStatusEnum.ACTIVE,
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

    return true;
}
