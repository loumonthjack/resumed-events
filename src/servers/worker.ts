import { CronJob } from 'cron';
import prisma from '../services/database';
import Messenger from '../services/mailer';
import { capitalizeName } from '../helper';
const checkForNonPaidEvents = async () => {
    const nonPaid = await prisma.event.findMany({
        where: {
            isPaid: false,
        },
    });
    return nonPaid;
}
const sendNonPaidEmails = async () => {
    const nonPaid = await checkForNonPaidEvents();
    const oneDayAgo = new Date();
    const twoDaysAgo = new Date();
    const nonPaidEventsOneDayAgo = nonPaid.filter((event) => {
        const eventEndDate = new Date(event.startDate);
        return oneDayAgo > eventEndDate;
    });
    const nonPaidEventsTwoDaysAgo = nonPaid.filter((event) => {
        const eventEndDate = new Date(event.startDate);
        return twoDaysAgo > eventEndDate;
    });
    nonPaidEventsOneDayAgo.forEach(async (event) => {
        await Messenger.sendNonPaidEmails(event.email, event);
    });
    nonPaidEventsTwoDaysAgo.forEach(async (event) => {
        await Messenger.sendNonPaidEmails(event.email, event);
    });
}
const checkForExpiredEvents = async () => {
    const expired = await prisma.event.findMany({
        where: {
            isArchived: false,
        },
    });

    const expiredEvents = expired.filter((event) => {
        const currentDateWithoutTime = new Date();
        currentDateWithoutTime.setHours(0, 0, 0, 0);

        const eventEndDate = new Date(event.endDate);

        // Since end dates are typically inclusive, the event is considered to end at the end of the given end date.
        const dayAfterEventEndDate = new Date(eventEndDate);
        dayAfterEventEndDate.setDate(dayAfterEventEndDate.getDate() + 1);
        return currentDateWithoutTime >= dayAfterEventEndDate;
    });
    return expiredEvents;
};
const sendNotifyEmails = async () => {
    const started = await prisma.event.findMany({
        where: {
            isArchived: false,
            isPaid: true,
        },
    });
    // today's date
    const currentDateWithoutTime = new Date();
    const attendeeToNotify = await prisma.attendeeNotify.findMany({
        where: {
            hasSent: false,
        },
    });
    const attendeeToNotifyToday = attendeeToNotify.filter((attendee) => {
        const event = started.find((event) => event.id === attendee.eventId);
        if (!event) return false;
        const eventStartDate = new Date(event.startDate);
        return currentDateWithoutTime >= eventStartDate;
    });
    attendeeToNotifyToday.forEach(async (attendee) => {
        const event = await prisma.event.findUnique({
            where: {
                id: attendee.eventId,
            },
        });
        if (!event) throw new Error('Event not found');
        await Messenger.sendNotifyEmails(attendee.email, event);
        await prisma.attendeeNotify.update({
            where: {
                id: attendee.id,
            },
            data: {
                hasSent: true,
            },
        });
    });
}
const archivedExpiredEvents = async () => {
    const expiredEvents = await checkForExpiredEvents();
    expiredEvents.forEach(async (event) => {
        await prisma.event.update({
            where: {
                id: event.id,
            },
            data: {
                isArchived: true,
            },
        });
        // post event report is sent to organizers
        await Messenger.sendPostEventEmails(event.organizers, {
            event: {
                ...event,
                displayName: capitalizeName(event.name),
            },
        });
    });
    // if two days have passed since event ended, send feedback email

}

const sendFeedbackEmails = async () => {
    const expired = await prisma.event.findMany({
        where: {
            isArchived: false,
        },
    });
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const expiredEventsOneDayAgo = expired.filter((event) => {
        const currentDateWithoutTime = new Date();
        currentDateWithoutTime.setHours(0, 0, 0, 0);
        const eventEndDate = new Date(event.endDate);
        // Since end dates are typically inclusive, the event is considered to end at the end of the given end date.
        const dayAfterEventEndDate = new Date(eventEndDate);
        dayAfterEventEndDate.setDate(dayAfterEventEndDate.getDate() + 1);

        return currentDateWithoutTime >= dayAfterEventEndDate
    });
    expiredEventsOneDayAgo.forEach(async (event) => {
        await Messenger.sendFeedbackEmails(event.email, event);
    });
};

const workerServer = async () => {
    console.log('Worker server started');
    // run every 1 hour
    // every 24 hours at 7am
    const job = new CronJob('0 0 7 * * *', async () => {
        await sendFeedbackEmails();
        await sendNonPaidEmails();
        await archivedExpiredEvents();
        await sendNotifyEmails();
    });
    job.start();
}

// Keep the process alive
setInterval(() => { }, 1000);

// RUN ONLY IF THIS IS THE MAIN FILE
if (require.main === module) {
    workerServer();
}