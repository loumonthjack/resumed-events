import express, { type Request, Response, NextFunction } from "express";
import db, { prisma } from "./database";
import mailer from "./mailer";

import { checkSubscription } from "./payment";
import { determineStripePaymentPage } from "../endpoints/networking/functions";

const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

function loginHandler() {
  return async (req: Request, res: Response) => {
    const { email } = req.body;
    // TODO validate incoming login data (email)

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: email.toLowerCase(),
      },
    });

    const session = await prisma.session.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (session === null) {
      const sessionCode = await db.createSession(user.id);

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
    console.log("verify handler");
    // TODO validate
    const { code, redirectTo, verified } = req.query;

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

    res.cookie("resumed-session", session.id, { maxAge: SESSION_MAX_AGE });

    // not sure what this for
    // if (verified) {
    //   await prisma.user.update({
    //     where: {
    //       id: session.userId,
    //     },
    //     data: {
    //       isVerified: true,
    //     },
    //   });
    // }

    // move to handler (handler defer? goto?)
    if (redirectTo) {
      const user = await prisma.user.findUnique({
        where: {
          id: session.userId,
        },
      });

      if (!user) {
        // WARN UR_1 - should be unreachable
        throw Error("[auth] UR_1: valid session but user undefined...");
      }

      const getLink = await determineStripePaymentPage(
        redirectTo.toString().toUpperCase(),
        user.email
      );

      if (getLink) {
        return res.redirect(getLink);
      }

      console.log("why redirect here???");
      return res.redirect('/');
    }

    const userSubscription = await prisma.subscription.findMany({
      where: {
        userId: session.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (userSubscription.length > 0) {
      userSubscription.forEach(async (subscription) => {
        await checkSubscription(subscription.externalId);
      });
    }

    console.log("/ redirect");
    return res.redirect('/');
  };
}

function sessionLoader() {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const sessionCookie = req.cookies["resumed-session"];

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
  };
}

export default {
  loginHandler,
  sessionLoader,
  verifyHandler,
};
