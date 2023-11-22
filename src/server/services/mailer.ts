import sendGrid from "@sendgrid/mail";
import { createId as cuid } from "@paralleldrive/cuid2";
import { renderTemplate } from "../templates";
import { FULL_SERVER_URL } from "../constants";
import { capitalizeName, getRoleName, removeDuplicates } from "../../helper";
import { Invite } from "@prisma/client";
import { prisma } from "./database";
import { eventNames } from "process";

class Sendgrid {
  private client;

  constructor() {
    this.client = sendGrid;
    this.client.setApiKey(process.env.SENDGRID_API_KEY || "");
  }

  public getInstance() {
    if (!this.client) {
      this.client = sendGrid;
      this.client.setApiKey(process.env.SENDGRID_API_KEY || "");
    }
    return this.client;
  }

  async sendEmail(to: string | string[], subject: string, body: string) {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "";
    const removeFirstElement = (arr: string[]) => {
      const [, ...rest] = arr;
      return rest;
    };
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
  async sendNonPaidEmails(to: string, data: any) {
    const event = { ...data };
    const template = renderTemplate("email/event-unpaid", {
      event: {
        ...data,
        displayName: capitalizeName(data.name),
      },
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error("Template could not be rendered");
    const success = this.sendEmail(
      to,
      "Resumed Events: Finish your event setup",
      template
    );
    if (!success) throw new Error("Email could not be sent to" + to);
    return success;
  }

  async sendNotifyEmails(to: string, data: any) {
    const template = renderTemplate("email/event-notify", {
      event: {
        ...data,
        displayName: capitalizeName(data.name),
      },
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error("Template could not be rendered");
    const success = this.sendEmail(
      to,
      "Resumed Events: " + capitalizeName(data.name) + " social portal is now live!",
      template
    );
    console.log(success);
    if (!success) throw new Error("Email could not be sent to" + to);
    return success;
  }

  async sendFeedbackEmails(to: string, data: any) {
    const template = renderTemplate("email/event-feedback", {
      event: data.event,
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error("Template could not be rendered");
    const success = this.sendEmail(
      to,
      "Resumed Events: How was your event?",
      template
    );
    if (!success) throw new Error("Email could not be sent to" + to);
    return success;
  }
  async sendPostEventEmails(to: string | string[], data: any) {
    const template = renderTemplate("email/event-report", {
      event: data.event,
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error("Template could not be rendered");
    const success = this.sendEmail(
      to,
      "Resumed Events: Your event report",
      template
    );
    if (!success) throw new Error("Email could not be sent to" + to);
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
    const template = renderTemplate("email/attendee-limit-email", {
      event: data.event,
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error("Template could not be rendered");
    const success = this.sendEmail(
      to,
      "Resumed Events: Your event has reached its attendee limit",
      template
    );
    if (!success) throw new Error("Email could not be sent to" + to);
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
    const template = renderTemplate("email/magic-link", {
      code: data.code,
      redirectTo: data.redirectTo,
      verified: data.verification,
      firstName: capitalizeName(data.name),
      loginUrl: `${FULL_SERVER_URL}/auth/verify?code=${data.code}${data.redirectTo ? "&redirectTo=" + data.redirectTo : ""
        }${data.verification ? "&verified=true" : ""}`,
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error("Template could not be rendered");
    const success = this.sendEmail(
      to,
      data.subject || "Resumed Events: Your Magic Link",
      template
    );
    if (!success) throw new Error("Email could not be sent to" + to);
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

    const template = renderTemplate("email/new-event-email", {
      event: data.event,
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error("Template could not be rendered");
    const success = this.sendEmail(
      to,
      `Resumed Events: ${capitalizeName(data.event.name)} is now live!`,
      template
    );
    if (!success) throw new Error("Email could not be sent to" + to);
    return success;
  }
  async sendInvitationEmail(
    to: string,
    data: {
      invite: Omit<Invite, "id" | "updatedAt" | "createdAt" | "status" | "emailStatus" | "externalId">;
      redirectTo?: string;
    }
  ) {
    const account = await prisma.account.findUnique({
      where: {
        id: data.invite.accountId
      }
    });
    const owner = await prisma.user.findUnique({
      where: {
        id: account?.userId
      }
    });
    
    if (!account) throw new Error("Account not found");
    let eventName: string | undefined = undefined;
    if (data.invite.eventId) {
      const event = await prisma.event.findUnique({
        where: {
          id: data.invite.eventId
        }
      });
      if (!event) throw new Error("Event not found");
     eventName = event.name;
    }
    const template = renderTemplate("email/invitation", {
      redirectTo: FULL_SERVER_URL+data.redirectTo,
      email: data.invite.email,
      role: getRoleName(data.invite.role),
      companyName: capitalizeName(account?.companyName || `${owner?.firstName} ${owner?.lastName}`),
      firstName: capitalizeName(data.invite.firstName || ""),
      lastName: capitalizeName(data.invite.lastName || ""),
      eventName: eventName ? capitalizeName(eventName) : undefined,
      SERVER_URL: FULL_SERVER_URL,
    });
    if (!template) throw new Error("Template could not be rendered");
    const success = this.sendEmail(
      to,
      capitalizeName(eventName || account.companyName || "resumed events") +": You've been invited to join staff as " + getRoleName(data.invite.role),
      template
    );
    if (!success) throw new Error("Email could not be sent to" + to);
    return success;
  }
}

const mailer = new Sendgrid();
export default mailer;
