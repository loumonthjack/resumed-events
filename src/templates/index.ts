import path from "path";
import fs from "fs";
import Mustache from "mustache";
import { AWS_BUCKET_NAME, FULL_SERVER_URL } from "../constants";

const EMAIL_BASE_PATH = "./email";
const WEBSITE_BASE_PATH = "./website";
const readFile = (basePath, fileName) =>
    fs.readFileSync(path.join(__dirname, `${basePath}/${fileName}`)).toString();

const websiteTemplates = {
    error: readFile(WEBSITE_BASE_PATH, "error.html"),
    eventOrganizerOnboarding: readFile(WEBSITE_BASE_PATH, "event-organizer-onboarding.html"),
    eventUserOnboarding: readFile(WEBSITE_BASE_PATH, "event-user-onboarding.html"),
    eventUserCodeSignup: readFile(WEBSITE_BASE_PATH, "event-user-code-signup.html" ),
    eventCode: readFile(WEBSITE_BASE_PATH, "event-landing.html"),
    eventUserCode: readFile(WEBSITE_BASE_PATH, "event-user-code.html"),
    eventCodeView: readFile(WEBSITE_BASE_PATH, "event-portal.html"),
    eventUpdate: readFile(WEBSITE_BASE_PATH, "event-update.html"),
    homepage: readFile(WEBSITE_BASE_PATH, "homepage.html"),
    eventComingSoon: readFile(WEBSITE_BASE_PATH, "event-coming-soon.html"),
    terms: readFile(WEBSITE_BASE_PATH, "terms.html"),
    privacy: readFile(WEBSITE_BASE_PATH, "privacy.html"),
    eventThankYou: readFile(WEBSITE_BASE_PATH, "thank-you.html"),
    login: readFile(WEBSITE_BASE_PATH, "login.html"),
    signup: readFile(WEBSITE_BASE_PATH, "signup.html"),
    dashboard: readFile(WEBSITE_BASE_PATH, "dashboard.html"),
};

const emailTemplates = {
    newEvent: readFile(EMAIL_BASE_PATH, "new-event.html"),
    unpaidEvent: readFile(EMAIL_BASE_PATH, "unpaid-event.html"),
    notifyAttendee: readFile(EMAIL_BASE_PATH, "notify-attendee.html"),
    report: readFile(EMAIL_BASE_PATH, "report.html"),
    attendeeAlert: readFile(EMAIL_BASE_PATH, "attendee-alert.html"),
    feedback: readFile(EMAIL_BASE_PATH, "feedback.html"),
    magicLink: readFile(EMAIL_BASE_PATH, "magic-link.html"),
};

const networkingConfig = {
    EMAIL_BUCKET: `https://s3.us-west-2.amazonaws.com/${AWS_BUCKET_NAME}/template/email`,
    AWS_BUCKET_NAME: `https://s3.us-west-2.amazonaws.com/${AWS_BUCKET_NAME}/template/website/`,
    SERVER_URL: FULL_SERVER_URL,
    CDN: `https://s3.us-west-2.amazonaws.com/${AWS_BUCKET_NAME}/template/website/dist`,
};
export const renderTemplate = (template, data = {}) => {
    const renderData = { ...networkingConfig, ...data };

    switch (template) {
        case "magic-link":
            return Mustache.render(emailTemplates.magicLink, renderData);
        case "event-feedback":
            return Mustache.render(emailTemplates.feedback, renderData);
        case "event-notify":
            return Mustache.render(emailTemplates.notifyAttendee, renderData);
        case "event-report":
            return Mustache.render(emailTemplates.report, renderData);
        case "event-unpaid":
            return Mustache.render(emailTemplates.unpaidEvent, renderData);
        case "attendee-limit-email":
            return Mustache.render(emailTemplates.attendeeAlert, renderData);
        case "new-event-email":
            return Mustache.render(emailTemplates.newEvent, { ...data });
        default:
            const matchingTemplate = process.env.PRODUCTION ? websiteTemplates[template] : getTemplate(template);
            if (!matchingTemplate) {
                return Mustache.render(websiteTemplates.error, renderData);
            }

            if (template === "eventCodeView") {
                renderData[AWS_BUCKET_NAME] = networkingConfig.AWS_BUCKET_NAME;
            }

            return Mustache.render(matchingTemplate, renderData);
    }
};

// TODO Temporary solution
const map = {
    error: "error.html",
    eventOrganizerOnboarding: "event-organizer-onboarding.html",
    eventUserOnboarding: "event-user-onboarding.html",
    eventUserCodeSignup: "event-user-code-signup.html" ,
    eventCode: "event-landing.html",
    eventUserCode: "event-user-code.html",
    eventCodeView: "event-portal.html",
    eventUpdate: "event-update.html",
    homepage: "homepage.html",
    eventComingSoon: "event-coming-soon.html",
    terms: "terms.html",
    privacy: "privacy.html",
    eventThankYou: "thank-you.html",
    login: "login.html",
    signup: "signup.html",
    dashboard: "dashboard.html",
}

function getTemplate(template) {
    return readFile(WEBSITE_BASE_PATH, map[template])
}