import express from 'express';
import mustacheExpress from 'mustache-express';
import sslRedirect from 'express-sslify';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { FULL_SERVER_URL, checkEnvironmentVariables, isProd, setEnvironment } from './constants';
import { renderTemplate } from './templates';
import webhookRoute from './endpoints/webhook/init';
import networkingRoute from './endpoints/networking/init';

const expressServer = async () => {
  const app = express();
  setEnvironment();
  checkEnvironmentVariables();
  //app.use(helmet());
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later."
  }));

  app.engine('mustache', mustacheExpress());
  app.set('view engine', 'mustache');
  app.use((req, res, next) => {
    console.log(req.hostname)
    console.log(req.rawHeaders)
    next();
  });
  if (isProd) app.use(sslRedirect());
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
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/', async (req, res) => res.send(renderTemplate('homepage')));
  app.get('/health-check', (req, res) => res.status(200).send('OK'));

  app.use(networkingRoute);
  app.use(webhookRoute);

  app.all('*', (req: any, res: any) => res.status(404).send(renderTemplate('error')));

  app.listen(process.env.PORT || 3000, () => console.log(`Server listening running ${FULL_SERVER_URL}`));
};

expressServer();