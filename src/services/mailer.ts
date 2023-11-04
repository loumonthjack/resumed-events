import sendGrid from '@sendgrid/mail';
import { renderTemplate } from '../templates';
import { FULL_SERVER_URL } from '../constants';
import prisma from './database';
import { capitalizeEventName, generateCUID, removeDuplicates } from '../helper';
import { determineStripePaymentPage, computeEventDuration } from '../endpoints/networking/functions';

class Sendgrid {
  private client;

  constructor() {
    this.client = sendGrid;
    this.client.setApiKey(process.env.SENDGRID_API_KEY || '');
  }

  public getInstance() {
    if (!this.client) {
      this.client = sendGrid;
      this.client.setApiKey(process.env.SENDGRID_API_KEY || '');
    }
    return this.client;
  }

  async sendEmail(to: string | string[], subject: string, body: string) {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || '';
    const removeFirstElement = (arr: string[]) => {
      const [, ...rest] = arr;
      return rest;
    }
    if (Array.isArray(to)) {
      const uniqueEmails = removeDuplicates(to);
      return uniqueEmails.forEach(async (email) => {
        const msg = {
          to: email,
          from: fromEmail,
          subject,
          html: body,
        };
        return this.getInstance().send(msg);
      });
    } else {
      const msg = {
        to,
        from: fromEmail,
        subject,
        html: body,
      };
      return this.getInstance().send(msg);
    }
  }
  async sendNonPaidEmails(
    to: string,
    data: any) {
      const event = { ...data };
    const template = renderTemplate('event-unpaid', {
      event: {
        ...data,
        displayName: capitalizeEventName(data.name),
      },
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error('Template could not be rendered');
    const success = this.sendEmail(
      to,
      'Resumed Events: Finish your event setup',
      template
    );
    if (!success) throw new Error('Email could not be sent to' + to);
    return success;
  }
  async sendNotifyEmails(
    to: string,
    data: any
  ) {
    const template = renderTemplate('event-notify', {
      event: {
        ...data,
        displayName: capitalizeEventName(data.name),
      },
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error('Template could not be rendered');
    const success = this.sendEmail(
      to,
      capitalizeEventName(data.name) + ' social portal is now live!',
      template
    );
    if (!success) throw new Error('Email could not be sent to' + to);
    return success;
  }
  async sendFeedbackEmails(
    to: string,
    data: any
  ) {
    const template = renderTemplate('event-feedback', {
      event: data.event,
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error('Template could not be rendered');
    const success = this.sendEmail(
      to,
      'Resumed Events: How was your event?',
      template
    );
    if (!success) throw new Error('Email could not be sent to' + to);
    return success;
  }
  async sendPostEventEmails(
    to: string | string[],
    data: any
  ) {
    const template = renderTemplate('event-report', {
      event: data.event,
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error('Template could not be rendered');
    const success = this.sendEmail(
      to,
      'Resumed Events: Your event report',
      template
    );
    if (!success) throw new Error('Email could not be sent to' + to);
    return success;
  }

  async sendAttendeeLimitEmail(
    to: string,
    data: {
      event: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
      };
    }
  ) {
    const template = renderTemplate('attendee-limit-email', {
      event: data.event,
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error('Template could not be rendered');
    const success = this.sendEmail(
      to,
      'Resumed Events: Your event has reached its attendee limit',
      template
    );
    if (!success) throw new Error('Email could not be sent to' + to);
    return success;
  }
  async sendLoginEmail(
    to: string,
    data: {
      code: string;
      name: string;
      subject?: string;
      verification?: boolean;
      redirectTo?: string;
    }
  ) {
    const template = renderTemplate('magic-link', {
      code: data.code,
      redirectTo: data.redirectTo,
      verified: data.verification,
      firstName: capitalizeEventName(data.name),
      loginUrl: `${FULL_SERVER_URL}/verify?code=${data.code}${data.redirectTo ? '&redirectTo=' + data.redirectTo : ''}${data.verification ? '&verified=true' : ''}`,
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error('Template could not be rendered');
    const success = this.sendEmail(
      to,
      data.subject || 'Resumed Events: Your Magic Link',
      template
    );
    if (!success) throw new Error('Email could not be sent to' + to);
    return success;
  }
  async sendEventWelcomeEmail(
    to: string | string[],
    data: {
      event: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
      };
    }
  ) {

    // update event with code
    const code = generateCUID();
    const event = await prisma.event.update({
      where: {
        id: data.event.id,
      },
      data: {
        tempKey: code,
      },
    });
    if (!event) throw new Error('Event could not be found');
    const template = renderTemplate('new-event-email', {
      event: data.event,
      authKey: event.tempKey,
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error('Template could not be rendered');
    const success = this.sendEmail(
      to,
      'Thank you for choosing Resumed Events',
      template
    );
    if (!success) throw new Error('Email could not be sent to' + to);
    return success;
  }
}

const Messenger = new Sendgrid();
export default Messenger;
