import express, { type Request, Response, NextFunction } from "express";
import db, { prisma } from "./database";
import mailer from "./mailer";
import sendgridClient from '@sendgrid/client';
import { EventWebhook } from '@sendgrid/eventwebhook';
import { checkSubscription } from "./payment";
import { determineStripePaymentPage, handleProfilePictureUpload } from "../endpoints/networking/functions";
import { EmailStatus, InviteStatus, RoleType, SubscriptionTypeEnum } from "@prisma/client";
import { getCookieName, setCookies } from "../middleware";
import { SENDGRID_WEBHOOK_KEY, env } from "../constants";

function signupHandler() {
  return async (req: Request, res: Response) => {
    const { email, firstName, lastName, terms, profilePicture, invitationId, companyName, redirectTo } = req.body;
    // TODO validate incoming register data (email, firstName, lastName)
    if (!email || !firstName || !lastName || !terms) {
      return res.sendStatus(400);
    }
    if (profilePicture === undefined) {
      delete req.body.profilePicture;
    }
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (user) {
      return res.send({ duplicate: true });
    }
    if (!invitationId) {
      const newUser = await db.create.adminUser({
        companyName: companyName.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        firstName: firstName.toLowerCase().trim(),
        lastName: lastName.toLowerCase().trim(),
        profilePicture: null,
        terms: terms === "yes",
        isFirstTime: true,
        isVerified: false,
      });
      if (req.body.profilePicture) {
        await handleProfilePictureUpload(profilePicture, newUser.id);
      }
      const userRole = await prisma.userRole.findFirst({
        where: {
          userId: newUser.id,
          Role: {
            name: RoleType.ADMINISTRATOR,
          },
        },
      });
      if (!userRole) {
        throw new Error("Failed to create user role");
      }
      const sessionCode = await db.create.session(userRole.id);
      await mailer.sendLoginEmail(email, {
        code: sessionCode.toString(),
        name: `${firstName} ${lastName}`,
        subject: "Resumed Events - Verify your email address",
        verification: true,
        redirectTo: redirectTo || '/dashboard?firstTime=true',
      });

      return res.send({ success: true });
    } else {
      const userId = await db.create.invitedUser({
        email: email.toLowerCase().trim(),
        firstName: firstName.toLowerCase().trim(),
        lastName: lastName.toLowerCase().trim(),
        profilePicture: null,
        terms: terms === "yes",
        isFirstTime: true,
        isVerified: false,
      }, invitationId);
      if (!userId) {
        throw new Error("Failed to create user");
      }
      if (!(req.body.profilePicture === 'undefined')) {
        await handleProfilePictureUpload(profilePicture, userId);
      }
      const invitation = await prisma.invite.findUnique({
        where: {
          id: invitationId,
        },
      });
      if (!invitation) {
        throw new Error("Failed to find invitation");
      }
      const userRole = await prisma.userRole.findFirst({
        where: {
          userId: userId,
          Role: {
            name: invitation.role,
          },
          eventId: invitation.eventId,
          accountId: invitation.accountId,
        },
      });
      if (!userRole) {
        throw new Error("Failed to create user role");
      }
      const sessionCode = await db.create.session(userRole.id);
      await mailer.sendLoginEmail(email, {
        code: sessionCode.toString(),
        name: `${firstName} ${lastName}`,
        subject: "Resumed Events - Verify your email address",
        verification: true,
        redirectTo: redirectTo || '/dashboard?firstTime=true',
      });

      return res.send({ success: true });
    }

  };
}

function logoutHandler() {
  return async (req: Request, res: Response) => {
    const sessionCookie = req.cookies[getCookieName()];

    if (!Boolean(sessionCookie)) {
      return res.sendStatus(400);
    }

    await prisma.session.delete({
      where: {
        id: sessionCookie,
      },
    });

    return res.redirect("/login");
  };
}
function loginHandler() {
  return async (req: Request, res: Response) => {
    const { email, invitationId } = req.body;
    // TODO validate incoming login data (email)

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: email.toLowerCase(),
      },
    });
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        isDefault: true,
      },
    });
    if (!userRole) {
      throw new Error("Failed to find user role");
    }
    if (invitationId) {
      await db.update.inviteStatus(invitationId, InviteStatus.ACCEPTED);
      const invite = await prisma.invite.findUnique({
        where: {
          id: invitationId,
        },
      });
      if (!invite) {
        throw new Error("Failed to find invitation");
      }
      const role = await prisma.role.findUnique({
        where: {
          name: invite.role,
        },
      });
      if (!role) {
        throw new Error("Failed to find role");
      }
      await db.create.userRole(user.id, role.id, invite.accountId, invite.eventId || undefined);
    }
    const session = await prisma.session.findFirst({
      where: {
        UserRole: {
          userId: user.id,
        },
      },
    });

    if (session === null) {
      const sessionCode = await db.create.session(userRole.id);

      await mailer.sendLoginEmail(email, {
        code: sessionCode.toString(),
        name: user.firstName,
      });

      return res.send({ success: true });
    }

    return res.send({ duplicate: true });
  };
}

// TODO debug verifyHandler
function verifyHandler() {
  return async (req: Request, res: Response) => {
    // TODO validate
    const { code, redirectTo, verified, firstTime } = req.query;

    if (!code) {
      return res.redirect("/login?error=no-code");
    }

    const session = await prisma.session.findUnique({
      where: {
        code: Number(code),
      },
    });

    if (!session) {
      return res.redirect("/login?error=no-session");
    }
    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        isVerified: true,
      },
    });
    const userRole = await prisma.userRole.findUnique({
      where: {
        id: session.userRoleId,
      },
    });
    if (!userRole) {
      throw new Error("Failed to find user role");
    }
    // not sure what this for
    if (verified) {
      await prisma.user.update({
        where: {
          id: userRole.userId,
        },
        data: {
          isVerified: true,
        },
      });
    }

    // move to handler (handler defer? goto?)
    if (redirectTo) {
      const user = await prisma.user.findUnique({
        where: {
          id: userRole.userId,
        },
      });

      if (!user) {
        // WARN UR_1 - should be unreachable
        throw Error("[auth] UR_1: valid session but user undefined...");
      }
      const paymentRedirect = [SubscriptionTypeEnum.BASIC, SubscriptionTypeEnum.PRO, SubscriptionTypeEnum.FREE, SubscriptionTypeEnum.CUSTOM]
      if (paymentRedirect.includes(redirectTo.toString().toUpperCase() as SubscriptionTypeEnum)) {
        const getLink = await determineStripePaymentPage(
          redirectTo.toString().toUpperCase(),
          user.email
        );

        if (getLink) {
          return res.redirect(getLink);
        }
      }
      setCookies(res, session.id);
      return res.redirect(redirectTo.toString());
    }

    const accountSubscription = await prisma.subscription.findMany({
      where: {
        accountId: userRole.accountId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (accountSubscription.length > 0) {
      accountSubscription.forEach(async (subscription) => {
        await checkSubscription(subscription.externalId);
      });
    }
    setCookies(res, session.id);
    return res.redirect("/dashboard");
  };
}

function sessionLoader() {
  return async function (req: Request, res: Response, next: NextFunction) {
    const sessionCookie = req.cookies[getCookieName()];

    if (!Boolean(sessionCookie)) {
      return next();
    }

    const session = await prisma.session.findUnique({
      where: {
        id: sessionCookie,
      },
    });

    if (session === null) {
      return next();
    }

    // TODO session validation
    req.session = session;
    return next();
  };
}
function inviteHandler() {
  return async function (req: Request, res: Response) {
    const { id } = req.query;
    if (!id) {
      return res.sendStatus(400);
    }
    const invite = await prisma.invite.findUnique({
      where: {
        id: id.toString(),
      },
      include: {
        Account: true,
      },
    });
    const user = await prisma.user.findUnique({
      where: {
        email: invite?.email,
      },
    });
    return user ? res.redirect(`/login?invitationId=${id}&read_only=${invite?.email}`) : res.redirect(`/signup?invitationId=${id}&read_only=${invite?.email}`);
  };
}
async function webhookHandler(req: Request, res: Response) {
  const events = req.body;

  for (const event of events) {
    const sgMessageId = event.sg_message_id;
    const eventType = event.event;
    const email = event.email;
    const attendeeInvite = await prisma.attendeeNotify.findUnique({
      where: {
        externalId: sgMessageId,
      },
    });
    if (attendeeInvite) {
      await prisma.attendeeNotify.update({
        where: {
          id: attendeeInvite.id,
        },
        data: {
          externalId: sgMessageId,
          emailStatus: eventType.toUpperCase(),
        },
      });
    } else {
      // get the email from the attendeeNotify table
      const notify = await prisma.attendeeNotify.findFirst({
        where: {
          email: email,
          externalId: null,
        },
      });
      if (notify) {
        await prisma.attendeeNotify.update({
          where: {
            id: notify.id,
          },
          data: {
            externalId: sgMessageId,
            emailStatus: eventType.toUpperCase(),
          },
        });
      }
    }
    const adminInvite = await prisma.invite.findUnique({
      where: {
        externalId: sgMessageId,
      },
    });
    if (adminInvite) {
      await prisma.invite.update({
        where: {
          id: adminInvite.id,
        },
        data: {
          externalId: sgMessageId,
          emailStatus: eventType.toUpperCase(),
        },
      });
    } else {
      const invite = await prisma.invite.findFirst({
        where: {
          email: email,
          externalId: null,
        },
      });
      if (invite) {
        await prisma.invite.update({
          where: {
            id: invite.id,
          },
          data: {
            emailStatus: eventType.toUpperCase(),
            externalId: sgMessageId,
          },
        });
      }
    }
  }
  return res.end('ok');
}


export default {
  loginHandler,
  sessionLoader,
  verifyHandler,
  signupHandler,
  logoutHandler,
  inviteHandler,
  webhookHandler,
};
