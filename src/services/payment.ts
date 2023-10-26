import { Request, Response as ExpressResponse, Router } from 'express';
import prisma from './database';
import Messenger from './mailer';
import { SubscriptionTypeEnum, SupportPriorityEnum } from '@prisma/client';

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
    const user = await prisma.event.findMany({
        where: {
            email: event.data.object.customer_details.email,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    if (!user) throw new Error('Event not found');
    // update isPaid attribute to true
    const filterEvent = user.filter((event) => event.isPaid === false);
    if (!filterEvent) throw new Error('Event not found');
    // get latest event
    const latestEvent = filterEvent[0];
    if (!latestEvent) throw new Error('Event not found');
    await prisma.event.update({
        where: {
            id: latestEvent.id,
        },
        data: {
            isPaid: true,
        },
    });

    await prisma.subscription.create({
        data: {
            Event: {
                connect: {
                    id: latestEvent.id,
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
    if (planType.name === SubscriptionTypeEnum.BASIC || planType.name === SubscriptionTypeEnum.PRO) {
        await prisma.eventConfigurations.create({
            data: {
                event: {
                    connect: {
                        id: latestEvent.id,
                    }
                },
                supportType: planType.name === SubscriptionTypeEnum.BASIC ? [SupportPriorityEnum.email, SupportPriorityEnum.zendesk] : [SupportPriorityEnum.email, SupportPriorityEnum.zendesk, SupportPriorityEnum.chat],
                hasAttendeeBranding: false,
                hasEventBranding: true,
                attendeesLimit: planType.codeLimit,
                maxDays: planType.dayLimit,
            }
        })
        latestEvent.organizers.push(event.data.object.customer_details.email)
        event = latestEvent;
        // send onboarding instructions
        await Messenger.sendEventWelcomeEmail(latestEvent.organizers, { event });
    }


    return true;
}
