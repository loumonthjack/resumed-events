import { NextFunction, Request, Response, Router } from 'express';
import { renderTemplate } from '../../templates';
import Messenger from '../../services/mailer';
import { uploadEventLogo } from '../../services/uploader';
import prisma from '../../services/database';
import cuid from 'cuid';
import multer from 'multer';
import { SubscriptionTypeEnum } from '@prisma/client';
import { capitalizeEventName, removeDuplicates } from '../../helper';
import { stripe } from '../../servers/webhook';
const QRCode = require('qrcode');

const MAX_EVENTS = 3;
const MAX_EVENT_DAYS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MAX_ONE_DAY_ATTENDEES = 200;
const MAX_TWO_DAY_ATTENDEES = 500;
const MAX_THREE_DAY_ATTENDEES = 500;
const validTLDs = [
    '.com', '.net', '.org', '.edu', '.gov', '.mil', '.biz', '.info',
    '.app', '.me', '.io', '.co', '.website'
];

const blackListedUrls = [
    'xvideos.com', 'pornhub.com', 'xnxx.com', 'xhamster.com', 'redtube.com', 'youporn.com',
    't.co', 'bit.ly', 'tinyurl.com', 'ow.ly', 'is.gd', 'buff.ly', 'adf.ly', 'goo.gl',
    'bit.do', 'bc.vc', 'j.mp', 'tr.im', 'tiny.cc', 'cutt.us', 'u.to', 'rebrand.ly', 'v.gd',
    'linktr.ee', 'tiny.pl', 'shorturl.at', 'cli.re', 'prettylinkpro.com', 'viralurl.com', 'bitly.com', 'prettylink.com'
];
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});
const networkingRoute: Router = Router();

type Event = {
    name: string;
    description: string;
    email: string;
    logo: string;
    startDate: string;
    endDate: string;
    type: string;
    theme: string;
    terms: boolean;
};

type EventAttendant = {
    data: {
        firstName: string;
        lastName: string;
        email: string;
        url: string;
        jobTitle: string;
        company: string;
        location: string;
        customField: string;
    }
    eventId: string;
};

async function checkEventExists(email: string) {
    const eventInfo = await prisma.event.findMany({ where: { email } });
    return eventInfo.length >= MAX_EVENTS;
}

export function computeEventDuration(startDate: string, endDate: string) {
    return new Date(endDate).getDate() - new Date(startDate).getDate();
}

function adjustEndDate(endDate: string, eventDuration: number) {
    if (eventDuration === 0) {
        const newEndDate = new Date(endDate);
        newEndDate.setDate(newEndDate.getDate() + 1);
        return newEndDate.toISOString().split('T')[0];
    }
    return endDate;
}

async function createEvent(name, email, logo, organizers, description, attendeeData, startDate, endDate, theme, terms) {
    const organizerEmails = organizers?.split(',').map((email) => email.trim());
    const emails = [email, ...organizerEmails];
    const event = await prisma.event.create({
        data: {
            id: cuid(),
            name: name.toLowerCase(),
            email: email,
            logo: logo || null,
            organizers: emails || null,
            description: description || null,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            theme: (theme || 'LIGHT').toUpperCase(),
            terms: terms === 'Yes',
        },
    });
    if (!event) return null;

    // remove empty strings from array
    const filteredAttendeeData = attendeeData.filter((data) => data !== "");


    await prisma.configuration.create({
        data: {
            event: {
                connect: {
                    id: event.id,
                },
            },
            attendeeData: filteredAttendeeData,
            showSlideControls: false,
            showAttendeeDetails: true,
            enableEarlyAccess: false,
            createdAt: new Date(),
        },
    });
    return event;
}

async function handleEventLogoUpload(eventLogo, eventId) {
    const upload = await uploadEventLogo(eventLogo.buffer, eventLogo.mimetype, eventId);
    if (upload) {
        await prisma.event.update({
            where: { id: eventId },
            data: { logo: upload },
        });
        return true;
    }
    return false;
}

export async function determineStripePaymentPage(eventDuration: number, mainEmail: string) {
    if (eventDuration >= 0 && eventDuration <= 2) {
        const planType = eventDuration === 0 ? SubscriptionTypeEnum.BASIC : SubscriptionTypeEnum.PRO;
        const subscription = await prisma.subscriptionType.findUnique({ where: { name: planType } });
        if (!subscription) return '/error';

        const paymentLink = await stripe.paymentLinks.retrieve(subscription.externalId);
        if (!paymentLink) return '/error';

        return `${paymentLink.url}?prefilled_email=${mainEmail}`;
    }
    return '/#contact';
}

async function getEventInfo(eventId: string) {
    const eventInfo = await prisma.event.findUnique({
        where: {
            id: eventId,
        },
    });
    if (!eventInfo) {
        return null;
    }
    return eventInfo;
}

function isValidUrl(url: string): boolean {
    return validTLDs.some(tld => url.includes(tld));
}

function isBlackListedUrl(url: string): boolean {
    return blackListedUrls.includes(url) || blackListedUrls.includes(url.slice(8));
}

function redirectOnError(res: Response, eventId: string, type: 'tld' | 'blacklist' | 'limit') {
    return res.redirect(`/networking/${eventId}/attendee?error=true&type=${type}`);
}

async function sendAttendeeLimitEmail(eventDuration: number, eventAttendants: any[], activeEvent: any) {
    const maxAttendeeLimits = {
        0: MAX_ONE_DAY_ATTENDEES,
        1: MAX_TWO_DAY_ATTENDEES,
        2: MAX_THREE_DAY_ATTENDEES,
    };

    if (eventAttendants.length === maxAttendeeLimits[eventDuration]) {
        await Messenger.sendAttendeeLimitEmail(activeEvent.email, {
            event: {
                ...activeEvent,
                startDate: activeEvent.startDate.toISOString(),
                endDate: activeEvent.endDate.toISOString(),
                percentage: Math.round((eventAttendants.length / maxAttendeeLimits[eventDuration]) * 100),
            }
        });
    }
}

function sendErrorTemplate(res: Response, message?: string) {
    return res.status(400).send(renderTemplate('error', { message: message || 'Event not found' }));
}

function sendCountdownTemplate(res: Response, eventInfo: any, banner: boolean = false) {
    const time = new Date().getDate()
    const newDate = new Date(eventInfo.startDate).getUTCDate()
    let days = newDate - time;
    const configuration = prisma.configuration.findUnique({
        where: {
            eventId: eventInfo.id,
        },
    });
    return res.send(renderTemplate('coming-soon', {
        message: capitalizeEventName(eventInfo.name) + ' is just ' + days + (days === 1 ? ' day' : ' days') + ' away!',
        configuration,
        showBanner: banner,
        event: {
            ...eventInfo,
            startDate: eventInfo.startDate,
            displayName: capitalizeEventName(eventInfo.name),
        },
    }));
}

async function generateQRCodes(eventAttendants: any[]) {
    const configuration = await prisma.configuration.findUnique({
        where: {
            eventId: eventAttendants[0].eventId,
        },
    });
    return Promise.all(
        eventAttendants.map(async (attendant) => {
            const qrCode = await QRCode.toDataURL(attendant.data.url, {
                color: { dark: '#fff', light: '#000' },
                width: 100,
                maskPattern: 7,
                height: 100,
                margin: 0,
                scale: 10,
                quality: 1,
            });
            return {
                url: attendant.data.url,
                qrCode,
                data: attendant.data,
                configuration,
            };
        })
    );
}

async function sendEventCodes(res: Response, eventInfo: any, eventId: string, qrCodes: any[]) {
    const configuration = await prisma.configuration.findUnique({
        where: {
            eventId: eventInfo.id,
        },
    });
    if (qrCodes.length > 1 || qrCodes.length === 0) {
        const message = qrCodes.length === 0
            ? 'Unfortunately, no one has joined this event yet.'
            : null;
        return res.send(renderTemplate('networking-code', {
            message,
            qrCodes,
            event: {
                ...eventInfo,
                displayName: capitalizeEventName(eventInfo.name),
            },
            configuration,
        }));
    }

    return res.send(renderTemplate('networking-code', {
        qrCode: qrCodes[0],
        event: {
            ...eventInfo,
            displayName: capitalizeEventName(eventInfo.name),
        },
        configuration,
    }));
}

async function $handleNetworkingPost(req: Request, res: Response) {
    if (!req.body) {
        return res.status(400).send('Missing event');
    }

    const { name: eventName, email: emailAddress, organizers, description, attendee_data, startDate, endDate, captureType: type, terms: acceptTerms, theme } = req.body;
    const eventLogo = req.file;
    const eventExists = await checkEventExists(emailAddress);
    if (eventExists) {
        return res.redirect(`/networking?error=true&type=exists`);
    }

    const eventDuration = computeEventDuration(startDate, endDate);
    if (eventDuration > MAX_EVENT_DAYS) {
        return res.redirect(`/#contact`);
    }

    const endDateString = adjustEndDate(endDate, eventDuration);
    const newEvent = await createEvent(eventName, emailAddress, null, organizers, description, attendee_data, startDate, endDateString, theme, acceptTerms);
    if (!newEvent) {
        return res.status(500).send('Error creating event');
    }

    if (eventLogo) {
        const uploadSuccess = await handleEventLogoUpload(eventLogo, newEvent.id);
        if (!uploadSuccess) {
            return res.status(500).send('Error uploading logo');
        }
    }

    const redirectUrl = await determineStripePaymentPage(eventDuration, newEvent.email);
    return res.redirect(redirectUrl);
}

const validEventMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    if (!eventInfo) {
        return sendErrorTemplate(res, 'Event not found');
    }
    // if event is archived, redirect to homepage
    if (eventInfo.isArchived) {
        return res.redirect('/');
    }

    if (!eventInfo.isPaid) {
        return sendErrorTemplate(res, 'Event not paid for');
    }

    const currentDateWithoutTime = new Date();
    currentDateWithoutTime.setHours(0, 0, 0, 0);

    const eventStartDate = new Date(eventInfo.startDate);
    const eventEndDate = new Date(eventInfo.endDate);

    if (eventStartDate > currentDateWithoutTime) {
        return sendCountdownTemplate(res, eventInfo);
    }

    // Since end dates are typically inclusive, the event is considered to end at the end of the given end date.
    const dayAfterEventEndDate = new Date(eventEndDate);
    dayAfterEventEndDate.setDate(dayAfterEventEndDate.getDate() + 1);

    if (currentDateWithoutTime >= dayAfterEventEndDate) {
        return sendErrorTemplate(res, 'Event has ended');
    }

    next();

};

function $sendOnboardingTemplate(req: Request, res: Response) {
    return res.send(renderTemplate('networking-event-onboarding'));
}

function $sendThankYouTemplate(req: Request, res: Response) {
    return res.send(renderTemplate('networking-thank-you'));
}

async function $sendEventUpdateTemplate(req: Request, res: Response, eventInfo: any) {
    const config = await prisma.configuration.findUnique({
        where: {
            eventId: eventInfo.id,
        },
    });
    // check if last element in array is company, first name, last name, email, job title, location
    const attendeeData = config?.attendeeData;
    const filteredData = attendeeData.filter((data) => data !== "company" && data !== "fullName" && data !== "emailAddress" && data !== "jobTitle" && data !== "location");

    const removeElement = eventInfo.organizers.indexOf(eventInfo.email);
    if (removeElement > -1) {
        eventInfo.organizers.splice(removeElement, 1);
    }
    const eventUpdateCode = renderTemplate('networking-event-update', {
        event: {
            ...eventInfo,
            organizers: removeDuplicates(eventInfo.organizers),
            linkedin: eventInfo.type?.toLowerCase() === 'linkedin',
            personal: eventInfo.type?.toLowerCase() === 'personal',
            both: eventInfo.type?.toLowerCase() === 'both',
            displayName: capitalizeEventName(eventInfo.name),
        },
        configuration: {
            fullName: config?.attendeeData.includes('fullName'),
            email: config?.attendeeData.includes('emailAddress'),
            jobTitle: config?.attendeeData.includes('jobTitle'),
            company: config?.attendeeData.includes('company'),
            location: config?.attendeeData.includes('location'),
            custom: filteredData ? filteredData.toString() : null,
        }
    });
    return res.send(eventUpdateCode);
}
function $sendEventLandingTemplate(req: Request, res: Response, eventInfo: any) {
    const eventCode = renderTemplate('networking-code-view', {
        event: {
            ...eventInfo,
            displayName: capitalizeEventName(eventInfo.name),
        },
    });
    return res.send(eventCode);
}

async function $sendAttendeeCodeTemplate(req: Request, res: Response, eventInfo: any) {
    const attendee = await prisma.eventAttendant.findUnique({
        where: {
            id: req.params.attendeeId,
        },
    });
    if (!attendee) {
        return sendErrorTemplate(res, 'Attendee not found');
    }
    const eventCode = renderTemplate('networking-attendee-code', {
        event: {
            ...eventInfo,
            displayName: capitalizeEventName(eventInfo.name),
        },
        attendee
    });
    return res.send(eventCode);
}
networkingRoute.get('/networking', $sendOnboardingTemplate);

networkingRoute.post('/networking', upload.single('fileupload'), $handleNetworkingPost);

networkingRoute.get('/networking/complete', $sendThankYouTemplate);

networkingRoute.get('/attendee/:eventId/notify', async (req: Request, res: Response) => {
    const email = req.query.emailAddress;
    if (!email) return sendErrorTemplate(res, 'Missing email');
    const event = await getEventInfo(req.params.eventId);
    if (!event) {
        return sendErrorTemplate(res, 'Event not found');
    }
    const attendee = await prisma.attendeeNotify.create({
        data: {
            email: email.toString(),
            event: {
                connect: {
                    id: event.id,
                }
            }
        }
    })
    if (!attendee) {
        return res.status(500).send('Error creating attendee');
    }
    return sendCountdownTemplate(res, event, true);
});
// show attendee form page
networkingRoute.get('/networking/:eventId/attendee', validEventMiddleware, async (req: Request, res: Response) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    const config = await prisma.configuration.findUnique({
        where: {
            eventId: eventInfo.id,
        },
    });
    const eventAddCode = renderTemplate('networking-user-onboarding', {
        event: {
            ...eventInfo,
            displayName: capitalizeEventName(eventInfo.name),
        },
        configuration: {
            fullName: config?.attendeeData.includes('fullName'),
            email: config?.attendeeData.includes('emailAddress'),
            jobTitle: config?.attendeeData.includes('jobTitle'),
            company: config?.attendeeData.includes('company'),
            location: config?.attendeeData.includes('location'),
            custom: config?.attendeeData.filter((data) => data !== "company" && data !== "fullName" && data !== "emailAddress" && data !== "jobTitle" && data !== "location").toString(),
        }
    });
    return res.send(eventAddCode);
});

// add attendee to event
// need to be adjusted to capture more data
networkingRoute.post('/networking/:eventId/attendee', validEventMiddleware, async (req: Request, res: Response) => {
    const activeEvent = await getEventInfo(req.params.eventId);
    const { title, company, location, name, email, custom } = req.body;
    const eventAttendants = await prisma.eventAttendant.findMany({
        where: {
            eventId: activeEvent.id,
        },
    });
    const eventDuration = new Date(activeEvent.endDate).getDate() - new Date(activeEvent.startDate).getDate();
    if (eventDuration <= 2 && eventAttendants.length >= [MAX_ONE_DAY_ATTENDEES, MAX_TWO_DAY_ATTENDEES, MAX_THREE_DAY_ATTENDEES][eventDuration]) {
        return redirectOnError(res, req.params.eventId, 'limit');
    }
    let url = req.body.linkedin || req.body.personal_website;
    if (!url) return sendErrorTemplate(res, 'Missing url');

    if (req.body.personalUrl && !isValidUrl(url)) {
        return redirectOnError(res, req.params.eventId, 'tld');
    }

    if (!url.includes('linkedin.com') && !isValidUrl(url)) {
        url = 'https://linkedin.com/in/' + url;
    }

    url = url.replace('http://', 'https://').replace('www.', '');
    if (!url.startsWith('https://')) {
        url = 'https://' + url;
    }

    if (isBlackListedUrl(url)) {
        return redirectOnError(res, req.params.eventId, 'blacklist');
    }
    const configuration = await prisma.configuration.findUnique({
        where: {
            eventId: activeEvent.id,
        },
    });
    const data = {
        fullName: name,
        emailAddress: email,
        jobTitle: title,
        company: company,
        custom: {
            "key": configuration.attendeeData.filter((data) => data !== "company" && data !== "fullName" && data !== "emailAddress" && data !== "jobTitle" && data !== "location").toString(),
            "value": custom || ""
        },
        url: url

    }

    const newUrl = await prisma.eventAttendant.create({
        data: {
            data,
            eventId: req.params.eventId, // isRequired
        },
    });

    if (!newUrl) {
        return res.status(500).send('Error creating url');
    }

    await sendAttendeeLimitEmail(eventDuration, eventAttendants, activeEvent);
    return res.redirect(`/networking/${req.params.eventId}/attendee/${newUrl.id}`);
});

// show attendant code share page
networkingRoute.get('/networking/:eventId/attendee/:attendeeId', validEventMiddleware, async (req: Request, res: Response) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    const attendant = await prisma.eventAttendant.findUnique({
        where: {
            id: req.params.attendeeId,
        },
    });
    if (!attendant) {
        return sendErrorTemplate(res, 'Attendee not found');
    }
    const qrCode = await QRCode.toDataURL(attendant.data["url"], {
        color: { dark: '#fff', light: '#000' },
        width: 100,
        maskPattern: 7,
        height: 100,
        margin: 0,
        scale: 10,
        quality: 1,
    });
    const configuration = await prisma.configuration.findUnique({
        where: {
            eventId: eventInfo.id,
        },
    });
    const eventAddCode = renderTemplate('networking-user-code', {
        event: {
            ...eventInfo,
            displayName: capitalizeEventName(eventInfo.name),
        },
        source: qrCode,
        data: attendant.data,
        configuration,
    });
    return res.send(eventAddCode);
});

// show event update page
networkingRoute.get('/:eventId/:code', async (req, res, next) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    if (!eventInfo) {
        return sendErrorTemplate(res, 'Event not found');
    }
    // if event is archived, redirect to homepage
    if (eventInfo.isArchived) {
        return res.redirect('/');
    }
    next();
}, async (req: Request, res: Response) => {

    const eventInfo = await prisma.event.findUnique({
        where: {
            id: req.params.eventId,
            tempKey: req.params.code,
        },
    });

    if (!eventInfo) {
        return sendErrorTemplate(res, 'Invalid code');
    }

    return $sendEventUpdateTemplate(req, res, eventInfo);
});

// update event in database
networkingRoute.post('/:eventId/:code', async (req, res, next) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    if (!eventInfo) {
        return sendErrorTemplate(res, 'Event not found');
    }
    // if event is archived, redirect to homepage
    if (eventInfo.isArchived) {
        return res.redirect('/');
    }
    next();
},
    upload.single('fileupload'),
    async (req: Request, res: Response) => {
        const activeEvent = await getEventInfo(req.params.eventId);
        const code = req.params.code;
        if (!code) return sendErrorTemplate(res, 'Invalid code');

        const { name: eventName, description, organizers, attendee_data } = req.body;
        const eventLogo = req.file;
        let logo: string | null = null;
        if (eventLogo) {
            const upload = await uploadEventLogo(
                eventLogo.buffer,
                eventLogo.mimetype,
                activeEvent.id
            );
            if (!upload) {
                return sendErrorTemplate(res, 'Error uploading logo');
            }
            logo = upload;
        }

        const emails = organizers?.split(',').map((email) => email.trim())
        emails.push(activeEvent.email);
        // remove empty strings from array and commas from emails
        if (emails.includes("")) {
            emails.splice(emails.indexOf(""), 1);
        }
        if (emails.includes(",")) {
            emails.splice(emails.indexOf(","), 1);
        }
        const updatedEvent = await prisma.event.update({
            where: {
                tempKey: code,
            },
            data: {
                ...activeEvent,
                name: eventName.toLowerCase(),
                logo: logo || activeEvent.logo,
                description: description || activeEvent.description,
                organizers: removeDuplicates(emails) || activeEvent.organizers,
            },
        });
        if (!updatedEvent) {
            return sendErrorTemplate(res, 'Error updating event');
        }
        const existingConfig = await prisma.configuration.findUnique({
            where: {
                eventId: updatedEvent.id,
            },
        });
        if (attendee_data) {
            if (existingConfig.attendeeData !== attendee_data) {
                const newAttendeeData = attendee_data.filter((data) => data !== "");
                const attendeeData = attendee_data;
                const filteredData = attendeeData.filter((data) => data !== "company" && data !== "fullName" && data !== "emailAddress" && data !== "jobTitle" && data !== "location");
                const customFields = filteredData && filteredData[0].includes(',') ? filteredData[0].split(',') : null;
                if (customFields) {
                    customFields.forEach((field) => {
                        field = field.trim();
                        if (!newAttendeeData.includes(field)) {
                            newAttendeeData.push(field);
                        }
                    });
                }
                const attendeeQuestions = removeDuplicates(newAttendeeData)
                attendeeQuestions.forEach((question) => {
                    if (question.includes(",")) {
                        attendeeQuestions.splice(attendeeQuestions.indexOf(question), 1);
                    }
                });
                await prisma.configuration.update({
                    where: {
                        eventId: updatedEvent.id,
                    },
                    data: {
                        attendeeData: attendeeQuestions,
                    },
                });
            }
        }

        return res.redirect(
            `/${updatedEvent.id}/${code}?success=true&event=${updatedEvent.name}`
        );
    }
);

// show event landing page
networkingRoute.get('/slider/:eventId/landing', validEventMiddleware, async (req: Request, res: Response) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    return $sendEventLandingTemplate(req, res, eventInfo);
});

// show attendee code share page
networkingRoute.get('/slider/:eventId/codes', validEventMiddleware, async (req: Request, res: Response) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    const eventAttendants = await prisma.eventAttendant.findMany({
        where: { eventId: req.params.eventId },
    });

    if (!eventAttendants) {
        return sendErrorTemplate(res, 'Event not found');
    }

    const qrCodes = await generateQRCodes(eventAttendants);

    return sendEventCodes(res, eventInfo, eventInfo.id, qrCodes);
});

networkingRoute.get('/terms', async (req: Request, res: Response) => {
    return res.send(renderTemplate('terms'));
});

networkingRoute.get('/privacy', async (req: Request, res: Response) => {
    return res.send(renderTemplate('privacy'));
});

export default networkingRoute;