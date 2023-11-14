import express from "express";
import cors from "cors";
import Stripe from "stripe";

import rateLimit from "express-rate-limit";

import router from "./router";

import { env } from "./constants";

// import astroServer from "./astro/dist/server/entry.mjs";

// import networkingRoute from "../endpoints/networking";

import { FULL_SERVER_URL, NODE_ENV, STRIPE_WEBHOOK_KEY } from "./constants";

export const stripe = new Stripe(STRIPE_WEBHOOK_KEY);

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

// TODO explain
// if (NODE_ENV === "production") app.use(sslRedirect());
if (NODE_ENV === "production") {
  app.use(
    cors({
      origin: (origin: any, callback: any) => {
        console.log("origin", origin);
        if (!origin || [FULL_SERVER_URL].includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );
}

// TODO explain
app.use(express.urlencoded({ extended: true }));

app.use(router);

// TODO error handler
// app.use(errorHandler);

const server = app.listen(env.PORT, () =>
  console.log(`Server listening running ${FULL_SERVER_URL}`)
);

console.log(`[server] address: ${JSON.stringify(server.address())}`);

server.on("connection", (socket) =>
  console.log(`[server] connection: ${JSON.stringify(socket.address())}`)
);
server.on("error", (err) => console.log(`[server] error: ${err}`));
server.on("dropRequest", (req, socket) =>
  console.log(`[server] req: ${JSON.stringify(req)}}`)
);
