import { Request, Response as ExpressResponse, Router } from 'express';
import prisma from './db-client';
import { FULL_SERVER_URL } from '../constants';
import Messenger from './mailer';
async function handleCharge(event: Request['body']) {
    if (!event.data.object.billing_details.email) throw new Error('No email provided by Stripe');
    // get user most recent event by email address and get isPaid attribute is false
    const user = await prisma.event.findFirst({
        where: {
            email: event.data.object.billing_details.email,
            isPaid: false,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    if (!user) throw new Error('Event not found');
    // update isPaid attribute to true
    await prisma.event.update({
        where: {
            id: user.id,
        },
        data: {
            isPaid: true,
        },
    });
    const durationInDays = 7; // example duration
    const startDate = new Date(user.startDate);
    const endDate = new Date(startDate.getTime() + (durationInDays * 24 * 60 * 60 * 1000)); // calculate end date based on start date and duration
    await Messenger.sendEventWelcomeEmail(event.data.object.billing_details.email, {
        event: {
            id: user.id,
            name: user.name.toLowerCase(),
            startDate: startDate.toISOString(), // convert date to string
            endDate: endDate.toISOString(), // convert date to string
        },
    });
    return true;
}
export async function webhookEvent(request: Request, response: ExpressResponse) {
    const event = request.body;
    console.log(event);
    if (event.type === 'charge.succeeded') {
        const payment = await handleCharge(event);
        if (!payment) throw new Error('Payment could not be processed');
        return  response.redirect(200, FULL_SERVER_URL + '/purchase');
    }
    return response.status(200).json({ received: true });
}