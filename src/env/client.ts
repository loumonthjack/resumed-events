import { NODE_ENV } from "./env";

const env = {
  DOMAIN_NAME: "resumed.events",
  PORT: 4000,
};

export const SERVER_URL: string =
  NODE_ENV === "production" ? env.DOMAIN_NAME : `localhost:${env.PORT}`;

export const FULL_SERVER_URL: string =
  NODE_ENV === "production" ? `https://${SERVER_URL}` : `http://${SERVER_URL}`;

export default env;
