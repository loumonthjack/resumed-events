import path from "path";
import fs from "fs";
import Mustache from "mustache";
import { AWS_BUCKET_NAME, FULL_SERVER_URL } from "../constants";

const EMAIL_BASE_PATH = "./email";
const WEBSITE_BASE_PATH = "./website";
const readFile = (basePath, fileName) =>
    fs.readFileSync(path.join(__dirname, `${basePath}/${fileName}`)).toString();

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
            const matchingTemplate = getTemplate(template);
            if (!matchingTemplate) {
                return Mustache.render(map["error"], renderData);
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
};

function getTemplate(template) {
    return readFile(WEBSITE_BASE_PATH, map[template])
}