import { z } from "zod";

import path from "path";

// load .env into process.env
import "dotenv/config";

// verify process.env
type NodeEnv = keyof typeof NODE_ENV_MAP;
type NodeEnvShort = (typeof NODE_ENV_MAP)[NodeEnv];

const NODE_ENV_MAP = {
  development: "local",
  production: "prod",
} as const;

// TODO undo this is unreadable 🤦‍♂️
export const NODE_ENV: NodeEnv = __ASSERT__isValid(
  process.env.NODE_ENV,
  isValidNodeEnv,
  `[env] invalid NODE_ENV:${
    process.env.NODE_ENV
  }, should be one of ${Object.keys(NODE_ENV_MAP)}`
);

// TODO move to validators file
const zEnvVar = z.object({
  SENDGRID_FROM_EMAIL: z.string(),
  PORT: z.coerce.number().optional().default(4000),
  DOMAIN_NAME: z.string().optional().default("resumed.events"),
  SENDGRID_API_KEY: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string(),
  AWS_BUCKET_NAME: z.string(),

  // TODO prod stripe env var test
  // does test version need to exist?
  STRIPE_WEBHOOK_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
});

// throws if invalid
export const env = zEnvVar.parse(process.env);

// Resumed URLs
export const PORT: number = env.PORT;
export const DOMAIN_NAME: string = env.DOMAIN_NAME;

// TODO combine these and create URL object (the localhost branch can be defaulted with DOMAIN_NAME)
export const SERVER_URL: string =
  NODE_ENV === "production" ? DOMAIN_NAME : `localhost:${PORT}`;
export const FULL_SERVER_URL: string =
  NODE_ENV === "production" ? `https://${SERVER_URL}` : `http://${SERVER_URL}`;

// AWS access keys and bucket name
export const AWS_ACCESS_KEY_ID: string = env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY: string = env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION: string = env.AWS_REGION;
export const AWS_BUCKET_NAME: string =
  env.AWS_BUCKET_NAME || `resumed-events-${getNodeEnvShort()}`;

// Stripe webhook and secret keys
export const STRIPE_WEBHOOK_KEY: string = env.STRIPE_WEBHOOK_KEY;
export const STRIPE_SECRET_KEY: string = env.STRIPE_SECRET_KEY;

// TODO get paths from central location
export const TEMPLATE_PATH = path.join(process.cwd(), "src/templates");
export const ASTRO_CLIENT_DIST_PATH = path.join(
  process.cwd(),
  "dist/astro/dist/client"
);

export const NETWORKING_CONFIG = {
  EMAIL_BUCKET: `https://s3.us-west-2.amazonaws.com/${AWS_BUCKET_NAME}/template/email`,
  AWS_BUCKET_NAME: `https://s3.us-west-2.amazonaws.com/${AWS_BUCKET_NAME}/template/website/`,
  SERVER_URL: FULL_SERVER_URL,
  CDN: `https://s3.us-west-2.amazonaws.com/${AWS_BUCKET_NAME}/template/website/dist`,
};

export const STRIPE_MANAGE_LINK: string =
  NODE_ENV === "production"
    ? "https://dashboard.stripe.com/test/settings/account"
    : "https://billing.stripe.com/p/login/test_aEU7uA7bP8ta5B68ww?prefilled_email=";

// functions

/**
 * returns the NODE_ENV, ie development, production, ...
 */
export function getNodeEnv() {
  return NODE_ENV;
}

/**
 * returns the short form of NODE_ENV, ie local, prod, ...
 */
export function getNodeEnvShort() {
  return NODE_ENV_MAP[NODE_ENV];
}

export function isValidNodeEnv(env: string): env is NodeEnv {
  return env in NODE_ENV_MAP;
}

export function isValidNodeEnvShort(env: string): env is NodeEnvShort {
  return Object.values(NODE_ENV_MAP).includes(env as NodeEnvShort);
}

// NOTE this fn is mostly an experiement, but i think i like it
/**
 * a simple value passthrough with isValid or throw logic
 * @param val - some value to be verified and returned
 * @param isValidFn - type guard fn
 * @param err - error message
 */
function __ASSERT__isValid<T>(
  val: any,
  isValidFn: (v: any) => v is T,
  err: string
): T {
  if (isValidFn(val)) {
    return val;
  }
  throw Error(err);
}
