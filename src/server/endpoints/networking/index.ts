// @ts-nocheck

import { Request, Response, Router } from "express";
import prisma from "../../services/database";
import { uploadEventLogo } from "../../services/uploader";
import { capitalizeEventName, removeDuplicates } from "../../../helper";
import {
  $sendOnboardingTemplate,
  upload,
  $handleNetworkingPost,
  $sendThankYouTemplate,
  sendErrorTemplate,
  getEventInfo,
  sendCountdownTemplate,
  validEventMiddleware,
  redirectOnError,
  isValidUrl,
  isBlackListedUrl,
  sendAttendeeLimitEmail,
  $sendEventUpdateTemplate,
  $sendEventLandingTemplate,
  generateQRCodes,
  sendEventCodes,
} from "./functions";
import QRCode from "../../services/generator";
import { createId as cuid } from "@paralleldrive/cuid2";

const MAX_ONE_DAY_ATTENDEES = 200;
const MAX_TWO_DAY_ATTENDEES = 500;
const MAX_THREE_DAY_ATTENDEES = 500;

const eventRouter = Router();

eventRouter.get("/create", $sendOnboardingTemplate);

eventRouter.post("/create", upload.single("fileupload"), $handleNetworkingPost);

eventRouter.get("/complete", $sendThankYouTemplate);

eventRouter.get(
  "/attendee/:eventId/notify",
  async (req: Request, res: Response) => {
    const email = req.query.emailAddress;
    if (!email) return sendErrorTemplate(res, "Missing email");
    const event = await getEventInfo(req.params.eventId);
    if (!event) {
      return sendErrorTemplate(res, "Event not found");
    }
    const attendee = await prisma.attendeeNotify.create({
      data: {
        email: email.toString(),
        event: {
          connect: {
            id: event.id,
          },
        },
      },
    });
    if (!attendee) {
      return res.status(500).send("Error creating attendee");
    }
    return sendCountdownTemplate(res, event, true);
  }
);
// show attendee form page
eventRouter.get(
  "/attendee/:eventId/create",
  validEventMiddleware,
  async (req: Request, res: Response) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    const config = await prisma.configuration.findUnique({
      where: {
        eventId: eventInfo.id,
      },
    });
    const eventAddCode = renderTemplate("eventUserOnboarding", {
      event: {
        ...eventInfo,
        displayName: capitalizeEventName(eventInfo.name),
      },
      configuration: {
        fullName: config?.attendeeData.includes("fullName"),
        email: config?.attendeeData.includes("emailAddress"),
        jobTitle: config?.attendeeData.includes("jobTitle"),
        company: config?.attendeeData.includes("company"),
        location: config?.attendeeData.includes("location"),
        custom: config?.attendeeData
          .filter(
            (data) =>
              data !== "company" &&
              data !== "fullName" &&
              data !== "emailAddress" &&
              data !== "jobTitle" &&
              data !== "location"
          )
          .toString(),
      },
    });
    return res.send(eventAddCode);
  }
);

// add attendee to event
// need to be adjusted to capture more data
eventRouter.post(
  "/attendee/:eventId/create",
  validEventMiddleware,
  async (req: Request, res: Response) => {
    const activeEvent = await getEventInfo(req.params.eventId);
    const { title, company, location, name, email, custom } = req.body;
    const eventAttendants = await prisma.eventAttendant.findMany({
      where: {
        eventId: activeEvent.id,
      },
    });
    const eventDuration =
      new Date(activeEvent.endDate).getDate() -
      new Date(activeEvent.startDate).getDate();
    if (
      eventDuration <= 2 &&
      eventAttendants.length >=
        [MAX_ONE_DAY_ATTENDEES, MAX_TWO_DAY_ATTENDEES, MAX_THREE_DAY_ATTENDEES][
          eventDuration
        ]
    ) {
      return redirectOnError(res, req.params.eventId, "limit");
    }
    let url = req.body.linkedin || req.body.personal_website;
    if (!url) return sendErrorTemplate(res, "Missing url");

    if (req.body.personalUrl && !isValidUrl(url)) {
      return redirectOnError(res, req.params.eventId, "tld");
    }

    if (!url.includes("linkedin.com") && !isValidUrl(url)) {
      url = "https://linkedin.com/in/" + url;
    }

    url = url.replace("http://", "https://").replace("www.", "");
    if (!url.startsWith("https://")) {
      url = "https://" + url;
    }

    if (isBlackListedUrl(url)) {
      return redirectOnError(res, req.params.eventId, "blacklist");
    }
    const configuration = await prisma.configuration.findUnique({
      where: {
        eventId: activeEvent.id,
      },
    });
    const attendeeId = cuid();
    const createShortLink = await QRCode.createLink(
      url,
      activeEvent.id + "/" + attendeeId
    );
    const createCode = await QRCode.create({
      url: createShortLink.shortURL,
      title: capitalizeEventName(activeEvent.name) + " - " + name,
      name: capitalizeEventName(name),
    });
    const data = {
      fullName: name,
      emailAddress: email,
      jobTitle: title,
      company,
      custom: {
        key: configuration.attendeeData
          .filter(
            (data) =>
              data !== "company" &&
              data !== "fullName" &&
              data !== "emailAddress" &&
              data !== "jobTitle" &&
              data !== "location"
          )
          .toString(),
        value: custom || "",
      },
      url,
      shortLinkId: createShortLink.id,
    };
    const newUrl = await prisma.eventAttendant.create({
      data: {
        id: attendeeId,
        data: { ...data },
        eventId: req.params.eventId,
        externalId: createCode,
      },
    });
    if (!newUrl) {
      return res.status(500).send("Error creating url");
    }

    await sendAttendeeLimitEmail(eventDuration, eventAttendants, activeEvent);
    return res.redirect(`/attendee/${req.params.eventId}/share/${newUrl.id}`);
  }
);

// show attendant code share page
eventRouter.get(
  "/attendee/:eventId/share/:attendeeId",
  validEventMiddleware,
  async (req: Request, res: Response) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    const attendant = await prisma.eventAttendant.findUnique({
      where: {
        id: req.params.attendeeId,
      },
    });
    if (!attendant) {
      return sendErrorTemplate(res, "Attendee not found");
    }
    const configuration = await prisma.configuration.findUnique({
      where: {
        eventId: eventInfo.id,
      },
    });
    const code = await QRCode.get(attendant.externalId);
    const eventAddCode = renderTemplate("eventUserCode", {
      event: {
        ...eventInfo,
        displayName: capitalizeEventName(eventInfo.name),
      },
      source: code.png,
      data: attendant.data,
      configuration,
    });
    return res.send(eventAddCode);
  }
);

// show event update page
eventRouter.get(
  "/update/:eventId/:code",
  async (req, res, next) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    if (!eventInfo) {
      return sendErrorTemplate(res, "Event not found");
    }
    // if event is archived, redirect to homepage
    if (eventInfo.isArchived) {
      return res.redirect("/");
    }
    next();
  },
  async (req: Request, res: Response) => {
    const eventInfo = await prisma.event.findUnique({
      where: {
        id: req.params.eventId,
        tempKey: req.params.code,
      },
    });

    if (!eventInfo) {
      return sendErrorTemplate(res, "Invalid code");
    }

    return $sendEventUpdateTemplate(req, res, eventInfo);
  }
);

// update event in database
eventRouter.post(
  "/update/:eventId/:code",
  async (req, res, next) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    if (!eventInfo) {
      return sendErrorTemplate(res, "Event not found");
    }
    // if event is archived, redirect to homepage
    if (eventInfo.isArchived) {
      return res.redirect("/");
    }
    next();
  },
  upload.single("fileupload"),
  async (req: Request, res: Response) => {
    const activeEvent = await getEventInfo(req.params.eventId);
    const code = req.params.code;
    if (!code) return sendErrorTemplate(res, "Invalid code");

    const {
      name: eventName,
      description,
      organizers,
      attendee_data,
    } = req.body;
    const eventLogo = req.file;
    let logo: string | null = null;
    if (eventLogo) {
      const upload = await uploadEventLogo(
        eventLogo.buffer,
        eventLogo.mimetype,
        activeEvent.id
      );
      if (!upload) {
        return sendErrorTemplate(res, "Error uploading logo");
      }
      logo = upload;
    }

    const emails = organizers?.split(",").map((email) => email.trim());
    emails.push(activeEvent.userId);
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
      return sendErrorTemplate(res, "Error updating event");
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
        const filteredData = attendeeData.filter(
          (data) =>
            data !== "company" &&
            data !== "fullName" &&
            data !== "emailAddress" &&
            data !== "jobTitle" &&
            data !== "location"
        );
        const customFields =
          filteredData && filteredData[0].includes(",")
            ? filteredData[0].split(",")
            : null;
        if (customFields) {
          customFields.forEach((field) => {
            field = field.trim();
            if (!newAttendeeData.includes(field)) {
              newAttendeeData.push(field);
            }
          });
        }
        const attendeeQuestions = removeDuplicates(newAttendeeData);
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
      `/update/${updatedEvent.id}/${code}?success=true&event=${updatedEvent.name}`
    );
  }
);

// show event landing page
eventRouter.get(
  "/share/:eventId/start",
  validEventMiddleware,
  async (req: Request, res: Response) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    return $sendEventLandingTemplate(req, res, eventInfo);
  }
);

// show attendee code share page
eventRouter.get(
  "/share/:eventId/portal",
  validEventMiddleware,
  async (req: Request, res: Response) => {
    const eventInfo = await getEventInfo(req.params.eventId);
    const eventAttendants = await prisma.eventAttendant.findMany({
      where: { eventId: req.params.eventId },
    });

    if (!eventAttendants) {
      return sendErrorTemplate(res, "Event not found");
    }

    const qrCodes = await generateQRCodes(eventAttendants);

    return sendEventCodes(res, eventInfo, eventInfo.id, qrCodes);
  }
);

eventRouter.get("/terms", async (req: Request, res: Response) => {
  return res.send(renderTemplate("terms"));
});

eventRouter.get("/privacy", async (req: Request, res: Response) => {
  return res.send(renderTemplate("privacy"));
});

export default eventRouter;
