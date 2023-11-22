import { CronJob } from 'cron';
import { prisma } from '../server/services/database';
import { SESSION_MAX_AGE } from '../server/middleware';
import mailer from './services/mailer';
import { JsonValue } from '@prisma/client/runtime/library';
const removeExpiredSessions = async () => {
    await prisma.session.deleteMany({
        where: {
            createdAt: {
                lte: new Date(new Date().getTime() - SESSION_MAX_AGE),
            },
        },
    });
    return;
};

const getDayStart = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

const workerServer = async () => {
    console.log('Worker server started');
    // run every 30 seconds
    const job = new CronJob('*/30 * * * * *', async () => {
        await removeExpiredSessions();
    });
    job.start();
}

// Keep the process alive
setInterval(() => { }, 1000);

// RUN ONLY IF THIS IS THE MAIN FILE
if (require.main === module) {
    workerServer();
}