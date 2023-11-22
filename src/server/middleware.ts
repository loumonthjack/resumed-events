import { prisma } from "./services/database";
import { NextFunction, type Response, Request } from "express";
import { NODE_ENV } from "./constants";
import { Session } from "@prisma/client";
export const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

const getSessionCookieValue = (cookieHeader: any) => {
  return cookieHeader?.split(';')
    .find((cookie: any) => cookie.includes(getCookieName))?.split('=')[1];
};

export function clearCookies(res: Response) {
  res.cookie(getCookieName(), '', { maxAge: 0 });
}

export function setCookies(res: Response, sessionId: Session["id"]) {
  res.cookie(getCookieName(), sessionId, { maxAge: SESSION_MAX_AGE });
}

export function getCookieName() {
  return `resumed-session${NODE_ENV === "production" ? undefined : NODE_ENV === "development" ? '-dev' : '-local'}`;
}
export const setUser = async (req: Request, res: Response, next: NextFunction) => {
  const cookie = getSessionCookieValue(req.headers.cookie);
  if (cookie) {
    const session = await prisma.session.findUnique({
      where: { id: cookie.toString() },
      include: {
        UserRole: {
          include: {
            Account: {
              include: {
                Subscription: true
              }
            }
          }
        }
      },
    });

    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.UserRole.userId },
      });

      if (user) {
        req.user = user;
        req.subscription = session.UserRole.Account.Subscription[0]; // Access the first element of the array
      }
    }
  }
  next();
};

export const redirectIfLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (req.session) {
    return res.redirect('/dashboard');
  }
  next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) {
    return res.status(400).json({ error: 'You must be logged in to perform this operation.' });
  }
  next();
}

export const setAuth = async (req: Request, res: Response, next: NextFunction) => {
  const cookie = getSessionCookieValue(req.headers.cookie);

  if (cookie) {
    const session = await prisma.session.findUnique({
      where: { id: cookie.toString() },
    });

    if (!session) {
      clearCookies(res);
      return res.redirect(`/login?error=no-session`);
    }

    if (['/login', '/signup'].includes(req.path)) {
      return res.redirect(`/dashboard`);
    }

    next();
  } else {
    clearCookies(res);

    await prisma.session.deleteMany({
      where: {
        createdAt: {
          lte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const allowedPaths = ['/login', '/signup', '/verify', '/attendee'];
    if (allowedPaths.includes(req.path)) {
      return next();
    } else {
      return res.redirect(`/login`);
    }
  }
};
