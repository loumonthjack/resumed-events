import sendGrid from '@sendgrid/mail';
import {renderTemplate} from '../templates';
import {FULL_SERVER_URL} from '../constants';
import prisma from './db-client';
import { generateCUID } from '../helper';

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

  async sendEmail(to: string, subject: string, body: string) {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || '';
    const msg = {
      to,
      from: fromEmail,
      subject,
      html: body,
    };
    return this.getInstance().send(msg);
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
  
  async sendEventWelcomeEmail(
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
