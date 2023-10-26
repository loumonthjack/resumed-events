import path from 'path';
import fs from 'fs';
import Mustache from 'mustache';
import { AWS_BUCKET_NAME, FULL_SERVER_URL } from '../constants';

const EMAIL_BASE_PATH = './email';
const WEBSITE_BASE_PATH = './website';

const ERROR_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/common/error.html`)).toString();
const NEW_EVENT_HTML = fs.readFileSync(path.join(__dirname, `${EMAIL_BASE_PATH}/new-event.html`)).toString();
const NETWORK_ORGANIZER_ONBOARDING_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/event-organizer-onboarding.html`)).toString();
const NETWORK_USER_ONBOARDING_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/event-user-onboarding.html`)).toString();
const NETWORK_USER_CODE_SIGNUP_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/event-user-code-signup.html`)).toString();
const NETWORK_CODE_VIEW_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/event-code.html`)).toString();
const NETWORK_USER_CODE_VIEW_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/event-user-code.html`)).toString();

const NETWORK_CODES_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/event-code-view.html`)).toString();

const NETWORK_EVENT_UPDATE_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/event-update.html`)).toString();
const NETWORK_HOMEPAGE_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/homepage.html`)).toString();
const NETWORK_EVENT_COMING_SOON_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/event-coming-soon.html`)).toString();
const NETWORK_EVENT_EXPIRED_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/event-expired.html`)).toString();

const EMAIL_NON_PAYMENT = fs.readFileSync(path.join(__dirname, `${EMAIL_BASE_PATH}/unpaid-event.html`)).toString();
const EMAIL_ATTENDEE_NOTIFY = fs.readFileSync(path.join(__dirname, `${EMAIL_BASE_PATH}/notify-attendee.html`)).toString();
const EMAIL_EVENT_REPORT = fs.readFileSync(path.join(__dirname, `${EMAIL_BASE_PATH}/report.html`)).toString();
const EMAIL_ATTENDEE_LIMIT = fs.readFileSync(path.join(__dirname, `${EMAIL_BASE_PATH}/attendee-alert.html`)).toString();
const EMAIL_EVENT_FEEDBACK = fs.readFileSync(path.join(__dirname, `${EMAIL_BASE_PATH}/feedback.html`)).toString();
export const renderTemplate = (template: string, data?: { [key: string]: any }, theme?: string): string | null => {
    const templates = {
        error: ERROR_HTML,
        email: {
            newEvent: NEW_EVENT_HTML,
            attendeeNotify: EMAIL_ATTENDEE_NOTIFY,
            attendeeLimit: EMAIL_ATTENDEE_LIMIT,
            eventReport: EMAIL_EVENT_REPORT,
            eventFeedback: EMAIL_EVENT_FEEDBACK,
            nonPayment: EMAIL_NON_PAYMENT,
        },
        terms: fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/terms.html`)).toString(),
        privacy: fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/privacy.html`)).toString(),
        networking: {
            event: {
                comingSoon: NETWORK_EVENT_COMING_SOON_HTML,
                expired: NETWORK_EVENT_EXPIRED_HTML,
                homepage: NETWORK_HOMEPAGE_HTML,
                organizerOnboarding: NETWORK_ORGANIZER_ONBOARDING_HTML,
                userOnboarding: NETWORK_USER_ONBOARDING_HTML,
                codeView: NETWORK_CODE_VIEW_HTML,
                codes: NETWORK_CODES_HTML,
                userCodeSignup: NETWORK_USER_CODE_SIGNUP_HTML,
                organizerUpdate: NETWORK_EVENT_UPDATE_HTML,
                userCode: NETWORK_USER_CODE_VIEW_HTML,
            },
        },
    };

    const websiteBucket = `https://s3.us-west-2.amazonaws.com/${AWS_BUCKET_NAME}/template/website/`
    const emailBucket = `https://s3.us-west-2.amazonaws.com/${AWS_BUCKET_NAME}/template/email`

    const networkingConfig = {
        AWS_BUCKET_NAME: websiteBucket,
        SERVER_URL: FULL_SERVER_URL,
    };
    const homePageCDN = `https://s3.us-west-2.amazonaws.com/${AWS_BUCKET_NAME}/template/website/dist`
    return (template === 'eventFeedback' ? Mustache.render(templates.email.eventFeedback,{ ...networkingConfig, ...data, CDN: homePageCDN }) : template === 'event-notify' ? Mustache.render(templates.email.attendeeNotify, { ...networkingConfig, ...data, CDN: homePageCDN }) : template === 'event-report' ? Mustache.render(templates.email.eventReport, { ...networkingConfig, ...data, CDN: homePageCDN }) : template === 'event-unpaid' ? Mustache.render(templates.email.nonPayment, { ...networkingConfig, ...data, CDN: homePageCDN }) :
        template === 'attendee-limit-email' ? Mustache.render(templates.email.attendeeLimit, { ...networkingConfig, ...data, CDN: homePageCDN }) : template === 'privacy' ? Mustache.render(templates.privacy, { ...networkingConfig, ...data, CDN: homePageCDN }) : template === 'terms' ? Mustache.render(templates.terms, { ...networkingConfig, ...data, CDN: homePageCDN }) : template === 'networking-user-code' ? Mustache.render(templates.networking.event.userCode, { ...networkingConfig, ...data, CDN: homePageCDN }) : template === 'homepage' ? Mustache.render(templates.networking.event.homepage, { ...networkingConfig, ...data, CDN: homePageCDN }) :
            template === 'coming-soon' ? Mustache.render(templates.networking.event.comingSoon, { ...networkingConfig, ...data, CDN: homePageCDN }) :
                template === 'expired' ? Mustache.render(templates.networking.event.expired, { ...networkingConfig, ...data, CDN: homePageCDN }) :
                    template === 'error'
                        ? Mustache.render(templates.networking.event.expired, { ...networkingConfig, ...data, CDN: homePageCDN }) : template === 'new-event-email'
                            ? Mustache.render(templates.email.newEvent, { ...data })
                            : template === 'networking-event-onboarding'
                                ? Mustache.render(templates.networking.event.organizerOnboarding, { ...networkingConfig, ...data })
                                : template === 'networking-user-onboarding'
                                    ? Mustache.render(templates.networking.event.userOnboarding, { ...networkingConfig, ...data })
                                    : template === 'networking-code'
                                        ? Mustache.render(templates.networking.event.codes, { ...networkingConfig, ...data, AWS_BUCKET_NAME: `${networkingConfig.AWS_BUCKET_NAME}event-code-view/` })
                                        : template === 'networking-code-view'
                                            ? Mustache.render(templates.networking.event.codeView, { ...networkingConfig, ...data, AWS_BUCKET_NAME: `${networkingConfig.AWS_BUCKET_NAME}event-code-view/`, CDN: homePageCDN })
                                            : template === 'networking-user-code-signup'
                                                ? Mustache.render(templates.networking.event.userCodeSignup, { ...networkingConfig, ...data })
                                                : template === 'networking-event-update'
                                                    ? Mustache.render(templates.networking.event.organizerUpdate, { ...networkingConfig, ...data })
                                                    : Mustache.render(templates.networking.event.expired, { ...networkingConfig, ...data, CDN: homePageCDN })
    );
};