import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import Stripe from "stripe";

import rateLimit from "express-rate-limit";

import router from "./router";

import { env } from "./constants";
// import astroServer from "./astro/dist/server/entry.mjs";

// import networkingRoute from "../endpoints/networking";

import { FULL_SERVER_URL, NODE_ENV, STRIPE_WEBHOOK_KEY } from "./constants";
import auth from "./services/auth";

export const stripe = new Stripe(STRIPE_WEBHOOK_KEY);
const main = async () => {
  const app = express();

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: "Too many requests from this IP, please try again later.",
    })
  );

  // TODO explain
  app.set("trust proxy", 1);

  // TODO use helmet https/cors
  // if (NODE_ENV === "production") app.use(sslRedirect());
    app.use(
      cors({
        origin: (origin: any, callback: any) => {
          console.log("origin", origin);
          if (!origin || [FULL_SERVER_URL, "http://localhost:3001"].includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
      })
    );

  // TODO explain
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.post("/webhook/sendgrid", auth.webhookHandler);

  app.use(router);


  // TODO error handler
  const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
    console.log(error);
    return res.redirect("/error");
  };

  app.use(errorHandler);

  app.listen(env.PORT, () =>
    console.log(`Server listening running ${FULL_SERVER_URL}`)
  );

}
main();