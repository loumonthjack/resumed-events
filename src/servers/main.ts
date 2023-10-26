import express from 'express';
import mustacheExpress from 'mustache-express';
import sslRedirect from 'express-sslify';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { FULL_SERVER_URL, checkEnvironmentVariables, isProd, setEnvironment } from '../constants';
import { renderTemplate } from '../templates';
import networkingRoute from '../endpoints/networking/init';

const expressServer = async () => {
  const app = express();
  setEnvironment();
  checkEnvironmentVariables();
  /*app.use(helmet({
    contentSecurityPolicy: false,
    hsts: false,
  }));*/
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later."
  }));
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

  app.listen(4000, () => console.log(`Server listening running ${FULL_SERVER_URL}`));
};

expressServer();