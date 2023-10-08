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
const NETWORK_CODE_VIEW_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/event-code-view.html`)).toString();
const NETWORK_EVENT_UPDATE_HTML = fs.readFileSync(path.join(__dirname, `${WEBSITE_BASE_PATH}/event-update.html`)).toString();

export const renderTemplate = (template: string, data?: { [key: string]: any }, theme?: string): string | null => {
    const templates = {
        error: ERROR_HTML,
        email: {
            newEvent: NEW_EVENT_HTML,
        },
        networking: {
            event: {
                organizerOnboarding: NETWORK_ORGANIZER_ONBOARDING_HTML,
                userOnboarding: NETWORK_USER_ONBOARDING_HTML,
                codeView: NETWORK_CODE_VIEW_HTML,
                userCodeSignup: NETWORK_USER_CODE_SIGNUP_HTML,
                organizerUpdate: NETWORK_EVENT_UPDATE_HTML,
            },
        },
    };

    const websiteBucket = `https://s3.us-west-2.amazonaws.com/${AWS_BUCKET_NAME}/template/website/`
    const emailBucket = `https://s3.us-west-2.amazonaws.com/${AWS_BUCKET_NAME}/template/email`

    const networkingConfig = {
        AWS_BUCKET_NAME: websiteBucket,
        SERVER_URL: FULL_SERVER_URL,
    };

    return (
        template === 'error'
            ? Mustache.render(templates.error, { AWS_BUCKET_NAME: `${websiteBucket}error/` })
            : template === 'new-event-email'
                ? Mustache.render(templates.email.newEvent, { ...data })
                : template === 'networking-event-onboarding'
                    ? Mustache.render(templates.networking.event.organizerOnboarding, { ...networkingConfig, ...data })
                    : template === 'networking-user-onboarding'
                        ? Mustache.render(templates.networking.event.userOnboarding, { ...networkingConfig, ...data })
                        : template === 'networking-code-view'
                            ? Mustache.render(templates.networking.event.codeView, { ...networkingConfig, ...data, AWS_BUCKET_NAME: `${networkingConfig.AWS_BUCKET_NAME}event-code-view/` })
                            : template === 'networking-user-code-signup'
                                ? Mustache.render(templates.networking.event.userCodeSignup, { ...networkingConfig, ...data })
                                : template === 'networking-event-update'
                                    ? Mustache.render(templates.networking.event.organizerUpdate, { ...networkingConfig, ...data })
                                    : Mustache.render(templates.error, { AWS_BUCKET_NAME: `${websiteBucket}error/` })
    );
};