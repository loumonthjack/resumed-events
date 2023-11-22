// @ts-nocheck
// TODO ...

import express from "express";
import { SubscriptionTypeEnum } from "@prisma/client";
import { prisma } from "../../services/database";
import { renderTemplate } from "../../templates";
import Messenger from "../../services/mailer";
import { uploadEventLogo, uploadProfilePicture } from "../../services/uploader";
import { capitalizeName, removeDuplicates } from "../../../helper";
import multer from "multer";
import QRCode from "../../services/generator";
import { SERVER_URL, STRIPE_MANAGE_LINK } from "../../constants";

import { createId as cuid } from "@paralleldrive/cuid2";

import { stripe } from "../../main";

const MAX_EVENTS = 3;
const MAX_EVENT_DAYS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MAX_ONE_DAY_ATTENDEES = 200;
const MAX_TWO_DAY_ATTENDEES = 500;
const MAX_THREE_DAY_ATTENDEES = 500;
const validTLDs = [
  ".com",
  ".net",
  ".org",
  ".edu",
  ".gov",
  ".mil",
  ".biz",
  ".info",
  ".app",
  ".me",
  ".io",
  ".co",
  ".website",
];

const blackListedUrls = [
  "xvideos.com",
  "pornhub.com",
  "xnxx.com",
  "xhamster.com",
  "redtube.com",
  "youporn.com",
  "t.co",
  "bit.ly",
  "tinyurl.com",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "adf.ly",
  "goo.gl",
  "bit.do",
  "bc.vc",
  "j.mp",
  "tr.im",
  "tiny.cc",
  "cutt.us",
  "u.to",
  "rebrand.ly",
  "v.gd",
  "linktr.ee",
  "tiny.pl",
  "shorturl.at",
  "cli.re",
  "prettylinkpro.com",
  "viralurl.com",
  "bitly.com",
  "prettylink.com",
];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

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
  };
  eventId: string;
};
export async function getLoggedInUser(
  req: express.Request,
  res: express.Response
) {
  const user = await prisma.user.findUnique({
    where: {
      id: req.session?.id,
    },
  });

  if (!user) {
    // TODO this is a waste (user can be null), but might be good to do something else, eg throw, redirect???
    return null;
  }

  return user;
}

export async function checkEventExists(userId: string) {
  const eventInfo = await prisma.event.findMany({ where: { userId } });
  return eventInfo.length;
}

export function computeEventDuration(startDate: string, endDate: string) {
  return new Date(endDate).getUTCDate() - new Date(startDate).getUTCDate();
}

export function adjustEndDate(endDate: string, eventDuration: number) {
  if (eventDuration === 0) {
    const newEndDate = new Date(endDate);
    newEndDate.setDate(newEndDate.getDate() + 1);
    return newEndDate.toISOString().split("T")[0];
  }
  return endDate;
}

export async function createEvent(userId: string, event, configuration) {
  const organizerEmails = event.organizers
    ?.split(",")
    .map((email) => email.toLowerCase().trim());
  const { name, logo, description, startDate, endDate } = event;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  const emails = [user.email, ...organizerEmails];
  // remove empty strings from array
  const filteredEmails = emails.filter((email) => email !== "");
  const create = await prisma.event.create({
    data: {
      id: `evt_${cuid()}`,
      name: name.toLowerCase(),
      userId,
      logo: logo || null,
      organizers: filteredEmails || null,
      externalId: null,
      description: description || null,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      theme: "LIGHT",
    },
  });
  if (!create) return null;
  const {
    attendeeData,
    showSlideControls,
    enableEarlyAccess,
    showAttendeeLeaderboard,
    notifyAttendees,
  } = configuration.event;
  const filteredAttendeeData = attendeeData.filter((data) => data !== "");
  await prisma.eventConfiguration.create({
    data: {
      id: `evtcfg_${cuid()}`,
      event: {
        connect: {
          id: create.id,
        },
      },
      attendeeData: filteredAttendeeData,
      showSlideControls: showSlideControls,
      enableEarlyAccess: enableEarlyAccess,
      showAttendeeLeaderboard: showAttendeeLeaderboard,
      setLimit: 250,
      createdAt: new Date(),
    },
  });

  notifyAttendees?.forEach(async (email) => {
    await prisma.attendeeNotify.create({
      data: {
        id: `attn_${cuid()}`,
        event: {
          connect: {
            id: create.id,
          },
        },
        email: email.toLowerCase().trim(),
        createdAt: new Date(),
        hasSent: false,
      },
    });
    if (enableEarlyAccess) {
      await Messenger.sendNotifyEmails(email, {
        ...create,
        startDate: new Date(event.startDate).toISOString(),
        endDate: new Date(event.endDate).toISOString(),
      });
    }
  });

  return create;
}
export async function handleProfilePictureUpload(profilePicture, userId) {
  const upload = await uploadProfilePicture(
    profilePicture.buffer,
    profilePicture.mimetype,
    userId
  );
  if (upload) {
    await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: upload },
    });
    return true;
  }
  return false;
}

export async function handleEventLogoUpload(eventLogo, eventId) {
  const upload = await uploadEventLogo(
    eventLogo.buffer,
    eventLogo.mimetype,
    eventId
  );
  if (upload) {
    await prisma.event.update({
      where: { id: eventId },
      data: { logo: upload },
    });
    return true;
  }
  return false;
}

export async function determineStripePaymentPage(name: string, email?: string) {
  const subscription = await prisma.subscriptionType.findUnique({
    where: { name: name.toUpperCase() as SubscriptionTypeEnum },
  });
  if (!subscription) return "/error";

  const paymentLink = await stripe.paymentLinks.retrieve(
    subscription.externalId
  );
  if (!paymentLink) return "/error";
  const userSubscriptions = await prisma.subscription.findMany({
    where: {
      User: {
        email,
      },
      status: "ACTIVE",
    },
  });
  if (userSubscriptions.length > 0) {
    return STRIPE_MANAGE_LINK + email;
  }
  // if user already has a active subscription, redirect to
  return email
    ? `${paymentLink.url}?prefilled_email=${email}`
    : paymentLink.url;
}

export async function getEventInfo(eventId: string) {
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

export function isValidUrl(url: string): boolean {
  return validTLDs.some((tld) => url.includes(tld));
}

export function isBlackListedUrl(url: string): boolean {
  return (
    blackListedUrls.includes(url) || blackListedUrls.includes(url.slice(8))
  );
}

export function redirectOnError(
  res: Response,
  eventId: string,
  type: "tld" | "blacklist" | "limit"
) {
  return res.redirect(`/attendee/${eventId}/create?error=true&type=${type}`);
}

export async function sendAttendeeLimitEmail(
  eventDuration: number,
  eventAttendants: any[],
  activeEvent: any
) {
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
        percentage: Math.round(
          (eventAttendants.length / maxAttendeeLimits[eventDuration]) * 100
        ),
      },
    });
  }
}

export function sendErrorTemplate(res: Response, message?: string) {
  return res
    .status(400)
    .send(renderTemplate("error", { message: message || "Event not found" }));
}

export function sendCountdownTemplate(
  res: Response,
  eventInfo: any,
  banner: boolean = false
) {
  const time = new Date().getUTCDate();
  const newDate = new Date(eventInfo.startDate).getUTCDate();
  let days = time - newDate;
  const configuration = prisma.eventConfiguration.findUnique({
    where: {
      eventId: eventInfo.id,
    },
  });
  return res.send(
    renderTemplate("eventComingSoon", {
      message:
        capitalizeName(eventInfo.name) +
        " is just " +
        days +
        (days === 1 ? " day" : " days") +
        " away!",
      configuration,
      showBanner: banner,
      event: {
        ...eventInfo,
        startDate: eventInfo.startDate,
        displayName: capitalizeName(eventInfo.name),
      },
    })
  );
}

export async function generateQRCodes(eventAttendants: any[]) {
  const configuration = await prisma.eventConfiguration.findUnique({
    where: {
      eventId: eventAttendants[0].eventId,
    },
  });
  return Promise.all(
    eventAttendants.map(async (attendant) => {
      const getCode = await QRCode.get(attendant.externalId);
      return {
        url: attendant.data.url,
        qrCode: getCode?.png,
        data: attendant.data,
        configuration,
      };
    })
  );
}

export async function sendEventCodes(
  res: Response,
  eventInfo: any,
  eventId: string,
  qrCodes: any[]
) {
  const configuration = await prisma.eventConfiguration.findUnique({
    where: {
      eventId: eventInfo.id,
    },
  });
  if (qrCodes.length > 1 || qrCodes.length === 0) {
    const message =
      qrCodes.length === 0
        ? "Unfortunately, no one has joined this event yet."
        : null;
    return res.send(
      renderTemplate("eventCodeView", {
        message,
        qrCodes,
        event: {
          ...eventInfo,
          displayName: capitalizeName(eventInfo.name),
        },
        configuration,
      })
    );
  }

  return res.send(
    renderTemplate("eventCodeView", {
      qrCode: qrCodes[0],
      event: {
        ...eventInfo,
        displayName: capitalizeName(eventInfo.name),
      },
      configuration,
    })
  );
}

export async function $handleNetworkingPost(req: Request, res: Response) {
  console.log("request", req.body);
  if (!req.body) {
    return res.status(400).send("Missing event");
  }

  const {
    name: eventName,
    invites,
    organizers,
    description,
    email,
    fullName,
    company,
    jobTitle,
    access,
    toggle,
    leaderboard,
    startDate,
    endDate,
  } = req.body;
  let notifyAttendees = invites ? invites.split(",") : null;
  const attendeeData = [];
  fullName === "true" ? attendeeData.push("fullName") : null;
  email === "true" ? attendeeData.push("emailAddress") : null;
  jobTitle === "true" ? attendeeData.push("jobTitle") : null;
  company === "true" ? attendeeData.push("company") : null;
  let configuration = {
    event: {
      enableEarlyAccess: access === "true",
      showSlideControls: toggle === "true",
      showAttendeeLeaderboard: leaderboard === "true",
      attendeeData,
      notifyAttendees,
    },
  };
  let event = {
    name: eventName,
    organizers: organizers,
    description: description,
    startDate: startDate,
    endDate: endDate,
  };
  const eventLogo = req.file;
  const eventDuration = computeEventDuration(startDate, endDate);
  const user = await getLoggedInUser(req, res);
  const endDateString = adjustEndDate(endDate, eventDuration);
  event.endDate = endDateString;
  const newEvent = await createEvent(user.id, event, configuration);
  if (!newEvent) {
    return res.status(500).send("Error creating event");
  }
  await QRCode.create({
    name: capitalizeName(newEvent.name),
    title: capitalizeName(newEvent.name) + " QR Code",
    url: "http://" + SERVER_URL + "/attendee/" + newEvent.id + "/create",
  }).then(async (code) => {
    await prisma.event.update({
      where: {
        id: newEvent.id,
      },
      data: {
        externalId: code,
      },
    });
    return code;
  });
  if (eventLogo) {
    const uploadSuccess = await handleEventLogoUpload(eventLogo, newEvent.id);
    if (!uploadSuccess) {
      return res.status(500).send("Error uploading logo");
    }
  }

  return res.send({ success: true, eventId: newEvent.id });
}

export const validEventMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const eventInfo = await getEventInfo(req.params.eventId);
  if (!eventInfo) {
    return sendErrorTemplate(res, "Event not found");
  }
  // if event is archived, redirect to homepage
  if (eventInfo.isArchived) {
    return res.redirect("/");
  }
  const eventConfiguration = await prisma.eventConfiguration.findUnique({
    where: {
      eventId: eventInfo.id,
    },
  });
  if (!eventConfiguration) {
    return sendErrorTemplate(res, "Event not found");
  }
  if (eventConfiguration.enableEarlyAccess) return next();

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
    return sendErrorTemplate(res, "Event has ended");
  }

  next();
};

export function $sendOnboardingTemplate(req: Request, res: Response) {
  return res.send(renderTemplate("eventOrganizerOnboarding"));
}

export function $sendThankYouTemplate(req: Request, res: Response) {
  return res.send(renderTemplate("eventThankYou"));
}

export async function $sendEventUpdateTemplate(
  req: Request,
  res: Response,
  eventInfo: any
) {
  const config = await prisma.eventConfiguration.findUnique({
    where: {
      eventId: eventInfo.id,
    },
  });
  // check if last element in array is company, first name, last name, email, job title, location
  const attendeeData = config?.attendeeData;
  const filteredData = attendeeData.filter(
    (data) =>
      data !== "company" &&
      data !== "fullName" &&
      data !== "emailAddress" &&
      data !== "jobTitle" &&
      data !== "location"
  );

  const removeElement = eventInfo.organizers.indexOf(eventInfo.email);
  if (removeElement > -1) {
    eventInfo.organizers.splice(removeElement, 1);
  }
  const eventUpdateCode = renderTemplate("eventUpdate", {
    event: {
      ...eventInfo,
      organizers: removeDuplicates(eventInfo.organizers),
      linkedin: eventInfo.type?.toLowerCase() === "linkedin",
      personal: eventInfo.type?.toLowerCase() === "personal",
      both: eventInfo.type?.toLowerCase() === "both",
      displayName: capitalizeName(eventInfo.name),
    },
    configuration: {
      fullName: config?.attendeeData.includes("fullName"),
      email: config?.attendeeData.includes("emailAddress"),
      jobTitle: config?.attendeeData.includes("jobTitle"),
      company: config?.attendeeData.includes("company"),
      location: config?.attendeeData.includes("location"),
      custom: filteredData ? filteredData.toString() : null,
    },
  });
  return res.send(eventUpdateCode);
}
export function $sendEventLandingTemplate(
  req: Request,
  res: Response,
  eventInfo: any
) {
  const eventCode = renderTemplate("eventCode", {
    event: {
      ...eventInfo,
      displayName: capitalizeName(eventInfo.name),
    },
  });
  return res.send(eventCode);
}

export async function $sendAttendeeCodeTemplate(
  req: Request,
  res: Response,
  eventInfo: any
) {
  const attendee = await prisma.eventAttendant.findUnique({
    where: {
      id: req.params.attendeeId,
    },
  });
  if (!attendee) {
    return sendErrorTemplate(res, "Attendee not found");
  }
  const eventCode = renderTemplate("eventUserCode", {
    event: {
      ...eventInfo,
      displayName: capitalizeName(eventInfo.name),
    },
    attendee,
  });
  return res.send(eventCode);
}
