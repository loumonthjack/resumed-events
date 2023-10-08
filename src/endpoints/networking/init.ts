import { Request, Response, Router } from 'express';
import { renderTemplate } from '../../templates';
import Messenger from '../../services/mailer';
import { uploadEventLogo } from '../../services/uploader';
import prisma from '../../services/db-client';
import cuid from 'cuid';
import multer from 'multer';
const QRCode = require('qrcode');

const MAX_EVENTS = 3;
const MAX_EVENT_DAYS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MAX_ONE_DAY_ATTENDEES = 250;
const MAX_TWO_DAY_ATTENDEES = 500;
const MAX_THREE_DAY_ATTENDEES = 750;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});

// Extracted function to capitalize event names
const capitalizeEventName = (name: string) => {
    const parts = name.split(' ');
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
};


const networkingRoute: Router = Router();

networkingRoute.get('/networking', async (req: Request, res: Response) => {
    return res.send(renderTemplate('networking-event-onboarding'));
});

networkingRoute.post(
    '/networking',
    upload.single('fileupload'),
    async (req, res) => {
        if (!req.body) {
            return res.status(400).send('Missing event');
        }
        const { name: eventName, email: emailAddress, startDate, endDate, captureType: type, terms: acceptTerms, theme } = req.body;
        const eventLogo = req.file;
        const eventInfo = await prisma.event.findMany({
            where: {
                email: emailAddress,
            },
        });
        if (eventInfo.length >= MAX_EVENTS) {
            return res.redirect(`/networking?error=true&type=exists`);
        }
        if (new Date(endDate).getDate() - new Date(startDate).getDate() > MAX_EVENT_DAYS) {
            return res.redirect(`/networking?error=true&type=duration`);
        }
        let logo: string | null = null;
        
        const newEvent = await prisma.event.create({
            data: {
                id: cuid(),
                name: eventName.toLowerCase(), // isRequired // identifier
                email: emailAddress, // isRequired
                logo: logo, // isOptional
                startDate: new Date(startDate).toISOString() || new Date().toISOString(), // isRequired
                endDate:
                    new Date(endDate).toISOString() || new Date().toISOString(), // isRequired
                type: type.toUpperCase() || 'EMAIL', // isRequired
                theme: theme ? theme.toUpperCase() : 'LIGHT', // isRequired
                terms: acceptTerms === 'Yes' || false, // isRequired
            },
        });
        if (!newEvent) {
            return res.status(500).send('Error creating event');
        }
        if (eventLogo) {
            const upload = await uploadEventLogo(
                eventLogo.buffer,
                eventLogo.mimetype,
                newEvent.id
            );
            if (!upload) {
                return res.status(500).send('Error uploading logo');
            }
            await prisma.event.update({
                where: {
                    id: newEvent.id,
                },
                data: {
                    logo: upload,
                },
            });
        }    
        
       const determineStripePaymentPage = () => {
        // if event is one day, return one day payment page
        if (new Date(endDate).getDate() - new Date(startDate).getDate() === 0) {
            return `https://buy.stripe.com/test_fZe5on7oP3bgfJu9AF`;
        }
        // if event is two days, return two day payment page
        if (new Date(endDate).getDate() - new Date(startDate).getDate() === 1) {
            return `https://buy.stripe.com/test_4gwbYI7oP3bgfJucQW`;
        }
        // if event is three days, return three day payment page
        if (new Date(endDate).getDate() - new Date(startDate).getDate() === 2) {
            return `https://buy.stripe.com/test_4gwbYI7oP3bgfJucQW`;
        }
       }
        return res.redirect(determineStripePaymentPage());
    });
networkingRoute.get('/networking/purchase', async (req, res) => {
    // check if session exists in stripe

    return res.redirect(`/networking/purchased?success=true`);
    //&event=${event}`);
});
// show add QR code page
networkingRoute.get('/networking/:eventId/user', async (req, res) => {
    const event = req.params.eventId;
    if (!event) {
        return res.status(400).send('Missing event');
    }
    const eventInfo = await prisma.event.findUnique({
        where: {
            id: event,
        },
    });
    if (!eventInfo) {
        return res.status(400).send(renderTemplate('error'));
    }
    if (eventInfo.isPaid === false) {
        return res.status(400).send(renderTemplate('error'));
    }
    const eventAddCode = renderTemplate('networking-user-onboarding', {
        event: {
            ...eventInfo,
            linkedin: eventInfo.type?.toLowerCase() === 'linkedin',
            personal: eventInfo.type?.toLowerCase() === 'personal',
            both: eventInfo.type?.toLowerCase() === 'both',
            displayName: capitalizeEventName(eventInfo.name),
        },
    });
    return res.send(eventAddCode);
});
networkingRoute.get('/networking/:eventId/:code', async (req, res) => {
    const event = req.params.eventId;
    const activeEvent = await prisma.event.findUnique({
        where: {
            id: event,
        },
    });
    if (!activeEvent) {
        return res.status(400).send(renderTemplate('error'));
    }
    if (activeEvent.isPaid === false) {
        return res.status(400).send(renderTemplate('error'));
    }
    const code = req.params.code;
    if (!event || !code) {
        return res.status(400).send('Missing event or code');
    }
    const eventInfo = await prisma.event.findUnique({
        where: {
            tempKey: code,
        },
    });
    if (!eventInfo) {
        return res.status(400).send(renderTemplate('error'));
    }
    if (eventInfo.tempKey !== code) {
        return res.status(400).send('Invalid code');
    }
    const eventAddCode = renderTemplate('networking-event-update', {
        event: {
            ...eventInfo,
            linkedin: eventInfo.type?.toLowerCase() === 'linkedin',
            personal: eventInfo.type?.toLowerCase() === 'personal',
            both: eventInfo.type?.toLowerCase() === 'both',
            displayName: capitalizeEventName(eventInfo.name),
        },
    });
    return res.send(eventAddCode);
});
networkingRoute.post(
    '/networking/:eventId/:code',
    upload.single('fileupload'),
    async (req, res) => {
        const event = req.params.eventId;
        const activeEvent = await prisma.event.findUnique({
            where: {
                id: event,
            },
        });
        if (!activeEvent) {
            return res.status(400).send(renderTemplate('error'));
        }
        if (activeEvent.isPaid === false) {
            return res.status(400).send(renderTemplate('error'));
        }
        const code = req.params.code;
        if (!event || !code) {
            return res.status(400).send('Missing event or code');
        }
        const eventInfo = await prisma.event.findUnique({
            where: {
                tempKey: code,
            },
        });
        if (!eventInfo) {
            return res.status(40).send(renderTemplate('error'));
        }
        const { name: eventName, startDate, endDate, captureType: type, terms: acceptTerms, theme } = req.body;
        const eventLogo = req.file;
        let logo: string | null = null;
        if (eventLogo) {
            const upload = await uploadEventLogo(
                eventLogo.buffer,
                eventLogo.mimetype,
                `${eventName.toLowerCase()}-${startDate}`
            );
            if (!upload) {
                return res.status(500).send('Error uploading logo');
            }
            logo = upload;
        }
        const data = {
            name: eventName ? eventName.toLowerCase() : eventInfo.name, // isRequired // identifier
            email: eventInfo.email, // isRequired
            logo: logo ? logo : eventInfo.logo, // isOptional
            startDate: startDate ? new Date(startDate) : eventInfo.startDate, // isRequired
            endDate: endDate ? new Date(endDate) : eventInfo.endDate,
            type: type ? type.toUpperCase() : eventInfo.type, // isRequired
            theme: theme ? theme.toUpperCase() : eventInfo.theme, // isRequired
            terms: acceptTerms ? acceptTerms === 'Yes' : eventInfo.terms, // isRequired
        };
        const updatedEvent = await prisma.event.update({
            where: {
                tempKey: code,
            },
            data,
        });
        if (!updatedEvent) {
            return res.status(500).send('Error updating event');
        }

        return res.redirect(
            `/networking/${updatedEvent.id}/${code}?success=true&event=${updatedEvent.name}`
        );
    }
);
// add QR code to networking event
networkingRoute.post('/networking/:eventId', async (req, res) => {
    const event = req.params.eventId;
    const activeEvent = await prisma.event.findUnique({
        where: {
            id: event,
        },
    });
    const eventAttendants = await prisma.eventAttendant.findMany({
        where: {
            eventId: event,
        },
    });
    if (!activeEvent || !activeEvent.isPaid) {
        return res.status(400).send(renderTemplate('error'));
    }
    const eventDuration = new Date(activeEvent.endDate).getDate() - new Date(activeEvent.startDate).getDate();
    if (eventDuration === 0 && eventAttendants.length >= MAX_ONE_DAY_ATTENDEES) {
        return res.redirect(`/networking/${req.params.eventId}/user?error=true&type=limit`);
    }
    if (eventDuration === 1 && eventAttendants.length >= MAX_TWO_DAY_ATTENDEES) {
        return res.redirect(`/networking/${req.params.eventId}/user?error=true&type=limit`);
    }
    if (eventDuration === 2 && eventAttendants.length >= MAX_THREE_DAY_ATTENDEES) {
        return res.redirect(`/networking/${req.params.eventId}/user?error=true&type=limit`);
    }
    let url = req.body.linkedInUrl || req.body.personalUrl;

    if (!url) {
        return res.status(400).send('Missing url');
    }
    const validTLDs = [
        '.com',
        '.net',
        '.org',
        '.edu',
        '.gov',
        '.mil',
        '.biz',
        '.info',
        '.app',
        '.me',
        '.io',
        '.co',
        '.website',
    ];
    // check if url has a valid tld
    if (req.body.personalUrl && !validTLDs.some(tld => url.includes(tld))) {
        return res.redirect(
            `/networking/${req.params.eventId}/user?error=true&type=tld`
        );
    }
    if (
        !url.includes('linkedin.com') &&
        // if url ends with a valid tld, dont add linkedin.com to the end
        !validTLDs.some(tld => url.endsWith(tld))
    ) {
        url = 'https://linkedin.com/in/' + url;
    }
    if (url.startsWith('http://') || url.startsWith('www.')) {
        url = url.replace('http://', 'https://');
        url = url.replace('www.', '');
    }
    if (!url.startsWith('https://')) {
        url = 'https://' + url;
    }
    /*
    const blackListedUrls = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_API_KEY}`,
      {
        method: 'POST',
        body: JSON.stringify({
          client: {
            clientId: 'resumed-website',
            clientVersion: '1.0.0',
          },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_networkingRouteLICATION',
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{url: url}],
          },
        }),
      }
    );
    if((blackListedUrls.matches.length > 0)) {
      return res.redirect(
        `/networking/${req.params.event}/user?error=true&type=blacklist`
      );
      }
    */
    const blackListedUrls = [
        'xvideos.com',
        'pornhub.com',
        'xnxx.com',
        'xhamster.com',
        'redtube.com',
        'youporn.com',
        't.co',
        'bit.ly',
        'tinyurl.com',
        'ow.ly',
        'is.gd',
        'buff.ly',
        'adf.ly',
        'goo.gl',
        'bit.do',
        'bc.vc',
        'j.mp',
        'tr.im',
        'tiny.cc',
        'cutt.us',
        'u.to',
        'rebrand.ly',
        'v.gd',
        'linktr.ee',
        'tiny.pl',
        'shorturl.at',
        'cli.re',
        'prettylinkpro.com',
        'viralurl.com',
        'bitly.com',
        'prettylink.com',
    ];

    if (
        blackListedUrls.includes(url) ||
        blackListedUrls.includes(url.slice(8))
    ) {
        return res.redirect(
            `/networking/${req.params.eventId}/user?error=true&type=blacklist`
        );
    }

    const newUrl = await prisma.eventAttendant.create({
        data: {
            url: url,
            eventId: req.params.eventId, // isRequired
        },
    });
    if (!newUrl) {
        return res.status(500).send('Error creating url');
    }
    if (eventDuration === 0 && eventAttendants.length === MAX_ONE_DAY_ATTENDEES) {
        await Messenger.sendAttendeeLimitEmail(activeEvent.email, {
            event: {
                id: activeEvent.id,
                name: activeEvent.name,
                startDate: activeEvent.startDate.toISOString(),
                endDate: activeEvent.endDate.toISOString(),
            },
        });
    }
    if (eventDuration === 1 && eventAttendants.length === MAX_TWO_DAY_ATTENDEES) {
        await Messenger.sendAttendeeLimitEmail(activeEvent.email, {
            event: {
                id: activeEvent.id,
                name: activeEvent.name,
                startDate: activeEvent.startDate.toISOString(),
                endDate: activeEvent.endDate.toISOString(),
            },
        });
    }
    if (eventDuration === 2 && eventAttendants.length === MAX_THREE_DAY_ATTENDEES) {
        await Messenger.sendAttendeeLimitEmail(activeEvent.email, {
            event: {
                id: activeEvent.id,
                name: activeEvent.name,
                startDate: activeEvent.startDate.toISOString(),
                endDate: activeEvent.endDate.toISOString(),
            },
        });
    }
    return res.redirect(`/networking/${req.params.eventId}/user?success=true`);
});

networkingRoute.get('/networking/:eventId', async (req, res) => {
    const event = req.params.eventId;
    if (!event) {
        return res.status(400).send(renderTemplate('error'));
    }
    const eventInfo = await prisma.event.findUnique({
        where: {
            id: event,
        },
    });
    if (!eventInfo) {
        return res.status(400).send(renderTemplate('error'));
    }
    if (eventInfo.isPaid === false) {
        return res.status(400).send(renderTemplate('error'));
    }
    if (new Date(eventInfo.startDate) > new Date()) {
        const eventCode = renderTemplate('networking-event-coming-soon', {
            message: 'Countdown to event',
            event: {
                logo: eventInfo.logo,
                name: event,
                displayName: capitalizeEventName(eventInfo.name),
                startDate: eventInfo.startDate,
            },
        });
        return res.send(eventCode);
    }
    if (new Date(eventInfo.endDate) < new Date()) {
        return res.status(400).send(renderTemplate('error'));
    }
    const eventAttendants = await prisma.eventAttendant.findMany({
        where: {
            eventId: event,
        },
    });
    if (!eventAttendants) {
        return res.status(400).send('Event could not be found');
    }
    const qrCodes = await Promise.all(
        eventAttendants.map(async (attendant: any) => {
            const qrCode = await QRCode.toDataURL(attendant.url,
                {
                    color: { dark: '#000', light: '#fff' },
                    width: 100,
                    maskPattern: 1,
                    height: 100,
                    margin: 0,
                    scale: 10,
                    quality: 1,
                }
            );
            return {
                url: attendant.url,
                qrCode: qrCode,
            };
        })
    );
    // if event attendees is greater than 1, return qr code and qr codes as null
    if (qrCodes.length > 1) {
        const eventCodes = renderTemplate('networking-code-view', {
            qrCodes: qrCodes,
            event: {
                logo: eventInfo.logo,
                name: event,
                displayName: capitalizeEventName(eventInfo.name),
            },
        });
        return res.send(eventCodes);
    } else if (qrCodes.length === 0) {
        const eventCode = renderTemplate('networking-code-view', {
            message: 'Unfortunately, no one has joined this event yet.',
            event: {
                logo: eventInfo.logo,
                name: event,
                displayName: capitalizeEventName(eventInfo.name),
            },
        });
        return res.send(eventCode);
    }
    const eventCode = renderTemplate('networking-code-view', {
        qrCode: qrCodes[0],
        event: {
            logo:
                eventInfo.logo ||
                null,
            name: event,
            displayName: capitalizeEventName(eventInfo.name),
        },
    });
    return res.send(eventCode);
});

export default networkingRoute;