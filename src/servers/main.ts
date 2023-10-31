import express from 'express';
import mustacheExpress from 'mustache-express';
import sslRedirect from 'express-sslify';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { FULL_SERVER_URL, checkEnvironmentVariables, isProd, setEnvironment } from '../constants';
import { renderTemplate } from '../templates';
import networkingRoute from '../endpoints/networking/init';
import webhookServer, { stripe } from './webhook';
import { handleCharge } from '../services/payment';

const expressServer = async () => {
  const app = express();
  setEnvironment();
  checkEnvironmentVariables();

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  }));
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
  express.json()
  app.use(express.urlencoded({ extended: true }));

  app.get('/', async (req, res) => res.send(renderTemplate('homepage')));
  app.get('/health-check', (req, res) => res.status(200).send('OK'));

  app.use(networkingRoute);

  app.all('*', (req: any, res: any) => res.status(404).send(renderTemplate('error')));

  app.listen(process.env.PORT, () => console.log(`Server listening running ${FULL_SERVER_URL}`));
};

webhookServer();
expressServer();
