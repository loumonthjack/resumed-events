import express from 'express';
import mustacheExpress from 'mustache-express';
import sslRedirect from 'express-sslify';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { FULL_SERVER_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_KEY, checkEnvironmentVariables, isProd, setEnvironment } from '../constants';
import { renderTemplate } from '../templates';
import networkingRoute from '../endpoints/networking';
import { handleCharge } from '../services/payment';
import { determineStripePaymentPage, handleProfilePictureUpload, upload } from '../endpoints/networking/functions';
import prisma from '../services/database';
import Messenger from '../services/mailer';
import { capitalizeEventName } from '../helper';
import { SubscriptionTypeEnum } from '@prisma/client';
export const stripe = require('stripe')(STRIPE_SECRET_KEY);
const expressServer = async () => {
  const app = express();
  setEnvironment();
  checkEnvironmentVariables();

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later."
  }));
  app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, STRIPE_WEBHOOK_KEY);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCharge(event);
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    // Return a 200 response to acknowledge receipt of the event
    response.send(200)
  });
  app.set("trust proxy", 1);

  app.engine('mustache', mustacheExpress());
  app.set('view engine', 'mustache');
  if (isProd) app.use(sslRedirect());
  if (isProd) {
    app.use(cors({
      origin: (origin: any, callback: any) => {
        console.log('origin', origin);
        if (!origin || [FULL_SERVER_URL].includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }));
  }
  app.use(express.urlencoded({ extended: true }));

  app.get('/', async (req, res) => res.send(renderTemplate('homepage')));
  app.get('/health-check', (req, res) => res.status(200).send('OK'));
  app.get('/terms', async (req, res) => res.send(renderTemplate('terms')));
  app.get('/privacy', async (req, res) => res.send(renderTemplate('privacy')));
  app.use(async (req, res, next) => {
    const cookie = req.headers.cookie?.split(';').find((cookie) => cookie.includes('resumed-session'))?.split('=')[1];
    if (cookie) {
      // if session exists and trying to access login or signup, redirect to dashboard
      const session = await prisma.session.findUnique({
        where: {
          id: cookie.toString(),
        },
      });
      if (!session) {
        res.cookie('resumed-session', '', { maxAge: 0 });
        return res.redirect(`/login?error=no-session`);
      }
      if (req.path === '/login' || req.path === '/signup') {
        return res.redirect(`/dashboard`);
      }
      next();
    } else {
      res.cookie('resumed-session', '', { maxAge: 0 });
      // clear expired sessions, sessions last 24 hours
      await prisma.session.deleteMany({
        where: {
          createdAt: {
            lte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
          },
        },
      });
      if (req.path === '/login' || req.path === '/signup' || req.path === '/verify' || req.path === '/attendee') {
        return next();
      } else {
        return res.redirect(`/login`);
      }
    }
  })
  app.get('/logout', async (req, res) => {
    const cookie = req.headers.cookie?.split(';').find((cookie) => cookie.includes('resumed-session'))?.split('=')[1];
    if (cookie) {
      await prisma.session.delete({
        where: {
          id: cookie.toString(),
        },
      });
      res.cookie('resumed-session', '', { maxAge: 0 });
    }
    return res.redirect('/login');
  });
  app.get('/login', async (req, res) => res.send(renderTemplate('login')));
  app.post('/login', upload.any(), async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      res.redirect('/login?error=exists')

    } else {
      // check if session exists
      const session = await prisma.session.findFirst({
        where: {
          userId: user.id,
        },
      });
      if (!session) {
        const sessionCode = Math.floor(100000 + Math.random() * 900000);
        // create a session
        await prisma.session.create({
          data: {
            User: {
              connect: {
                id: user.id,
              },
            },
            code: sessionCode,
            createdAt: new Date(),
          },
        });
        // send email
        await Messenger.sendLoginEmail(email, {
          code: sessionCode.toString(),
          name: user.firstName,
        });
      } else {
        return res.send({ duplicate: true })
      }

    }

    return res.send({ success: true });
  });
  app.get('/verify', async (req, res) => {
    const { code, redirectTo, verified } = req.query;
    if (!code) {
      res.redirect('/login?error=no-code');
    } else {
      const session = await prisma.session.findUnique({
        where: {
          code: Number(code),
        },
      });
      if (!session) {
        res.redirect('/login?error=no-session');
      } else {
        // create cookie valid for 24 hours
        res.cookie('resumed-session', session.id, { maxAge: 24 * 60 * 60 * 1000 });
        /*if (verified) {
          await prisma.user.update({
            where: {
              id: session.userId,
            },
            data: {
              isVerified: true,
            },
          });
        }*/
        if (redirectTo) {
          const user = await prisma.user.findUnique({
            where: {
              id: session.userId,
            },
          });
          const getLink = await determineStripePaymentPage(redirectTo.toString().toUpperCase(), user.email);
          if (getLink) {
            return res.redirect(getLink);
          }
        } else {
          res.redirect(`/dashboard`);
        }
      }
    }
  });
  app.get('/dashboard', async (req, res) => {
    const { show } = req.query;
    const cookie = req.headers.cookie?.split(';').find((cookie) => cookie.includes('resumed-session'))?.split('=')[1];
    if (cookie) {
      const sessionData = await prisma.session.findUnique({
        where: {
          id: cookie.toString(),
        },
        include: {
          User: {
            include: {
              Subscription: true,
            }
          }
        },
      });
      if (!sessionData) {
        res.redirect('/login?error=no-session');
      } else {
        if (!sessionData.User.profilePicture){
          sessionData.User.profilePicture = 'https://s3.amazonaws.com/app.resumed.website/profile_pics/default.png'
        }
        const events = await prisma.event.findMany({
          where: {
            userId: sessionData.userId,
          },
          include: {
            EventConfigurations: true,
            Configuration: true,
            EventAttendant: true,
            AttendeeNotify: true,
            User: true,
          }
        });
        const mostRecentSubscription = await prisma.subscription.findFirst({
          where: {
            userId: sessionData.userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        if(mostRecentSubscription) {
        const subscriptionType = await prisma.subscriptionType.findUnique({
          where: {
            id: mostRecentSubscription.subscriptionTypeId,
          },
        });
        res.send(renderTemplate('dashboard', {
          user: sessionData.User,
          //isActive: mostRecentSubscription.status === 'ACTIVE',
          subscription: capitalizeEventName(subscriptionType.name.toLowerCase()),
          showSettings: show === 'settings' ? true : null,
          showEvents: (show === 'events') || !show ? true : null,
          showEventAttendants: show === 'attendants' ? true : null,
          showBilling: show === 'billing' ? true : null,
          showProfile: show === 'profile' ? true : null,
          showHelp: show === 'help' ? true : null,
          eventCount: events.length,
          events: events.map((event) => ({
            ...event,
            displayName: capitalizeEventName(event.name),
          })),
        }));
      }else {
        res.send(renderTemplate('dashboard', {
          user: sessionData.User,
          //isActive: mostRecentSubscription.status === 'ACTIVE',
          subscription: null,
          showSettings: show === 'settings' ? true : null,
          showEvents: (show === 'events') || !show ? true : null,
          showEventAttendants: show === 'attendants' ? true : null,
          showBilling: show === 'billing' ? true : null,
          showProfile: show === 'profile' ? true : null,
          showHelp: show === 'help' ? true : null,
          eventCount: events.length,
          events: events.map((event) => ({
            ...event,
            displayName: capitalizeEventName(event.name),
          })),
        }));
      }
    } 
    } else {
      res.redirect('/login?error=invalid');
    }
  });


  app.get('/signup', async (req, res) => res.send(renderTemplate('signup')));
  app.post('/signup', upload.single('profilePicture'), async (req, res) => {
    const { email, firstName, lastName, terms, redirectTo } = req.body;
    const createUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        terms: terms === "yes" ? true : false,
      },
    });
    if (req.file) {
      await handleProfilePictureUpload(req.file, createUser.id);
    }
    const sessionCode = Math.floor(100000 + Math.random() * 900000);
    // create a session
    await prisma.session.create({
      data: {
        User: {
          connect: {
            id: createUser.id,
          },
        },
        code: sessionCode,
        createdAt: new Date(),
      },
    });
    await Messenger.sendLoginEmail(email, {
      code: sessionCode.toString(),
      subject: 'Action Required: Activate your account - Resumed Events',
      redirectTo: redirectTo ? redirectTo.toString().toUpperCase() : null,
      name: createUser.firstName,
      verification: true,
    });
    return res.send({ success: true });
  });

  app.use(networkingRoute);

  app.all('*', (req: any, res: any) => res.status(404).send(renderTemplate('error')));

  app.listen(process.env.PORT, () => console.log(`Server listening running ${FULL_SERVER_URL}`));
};

expressServer();
