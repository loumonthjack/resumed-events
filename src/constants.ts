// load environment and verify env vars
type NodeEnv = keyof typeof NODE_ENV_MAP;
type NodeEnvShort = typeof NODE_ENV_MAP[NodeEnv];

const NODE_ENV_MAP = {
    "localhost": "local",
    "production": "prod",
} as const;

export const NODE_ENV: NodeEnv = __ASSERT__isValid(
    process.env.NODE_ENV, 
    isValidNodeEnv, 
    `[env] invalid NODE_ENV, should be one of ${Object.keys(NODE_ENV_MAP)}`
);

const REQUIRED_ENV_VARS = [
    'SENDGRID_FROM_EMAIL', 
    'DOMAIN_NAME', 
    'SENDGRID_API_KEY', 
    'AWS_ACCESS_KEY_ID', 
    'AWS_SECRET_ACCESS_KEY', 
    'AWS_REGION', 
    'AWS_BUCKET_NAME',
    NODE_ENV === "production" ? 'STRIPE_WEBHOOK_KEY' : 'STRIPE_WEBHOOK_KEY_TEST',
    NODE_ENV === "production" ? 'STRIPE_SECRET_KEY' : 'STRIPE_SECRET_KEY_TEST',
];

REQUIRED_ENV_VARS.forEach((envVar) => {
    if (!process.env[envVar]) {
        throw new Error(`[env] ${envVar} is not defined, check the .env`);
    }
});

// Resumed URLs
export const PORT: number = parseInt(process.env.PORT || '4000');
export const DOMAIN_NAME: string = process.env.DOMAIN_NAME || 'resumed.events';
export const SERVER_URL: string = NODE_ENV === "production" ? DOMAIN_NAME : `${NODE_ENV}:${PORT}`;
export const FULL_SERVER_URL: string = NODE_ENV === "production" ? `https://${SERVER_URL}` : `http://${SERVER_URL}`;

// AWS access keys and bucket name
export const AWS_ACCESS_KEY_ID: string = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY: string = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION: string = process.env.AWS_REGION;
export const AWS_BUCKET_NAME: string = process.env.AWS_BUCKET_NAME || `resumed-events-${getNodeEnvShort()}`;

// Stripe webhook and secret keys
export const STRIPE_WEBHOOK_KEY: string = NODE_ENV === "production" ? process.env.STRIPE_WEBHOOK_KEY : process.env.STRIPE_WEBHOOK_KEY_TEST;
export const STRIPE_SECRET_KEY: string = NODE_ENV === "production" ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_KEY_TEST;

console.log('cwd', process.cwd(), __dirname)
export const TEMPLATE_PATH = process.cwd() + '/src/templates/'

/**
 * returns the NODE_ENV, ie localhost, production, ...
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

export function isValidNodeEnv(env): env is NodeEnv {
    return env in NODE_ENV_MAP;
}

export function isValidNodeEnvShort(env): env is NodeEnvShort {
    return Object.values(NODE_ENV_MAP).includes(env);
}


// NOTE this fn is mostly an experiement, but i think i like it
/**
 * a simple value passthrough with isValid or throw logic
 * @param val - some value to be verified and returned
 * @param isValidFn - type guard fn
 * @param err - error message
 */
function __ASSERT__isValid<T>(val: any, isValidFn: (v: any) => v is T, err: string): T {
    if (isValidFn(val)) {
        return val
    }
    throw Error(err)
}