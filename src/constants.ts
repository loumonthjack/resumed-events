// Define the port number
export const PORT: number = parseInt(process.env.PORT || '4000');

// Define the environment
export const NODE_ENV: string | undefined = process.env.NODE_ENV;
const validEnvironment = ['localhost', 'production'];
export const setEnvironment = () => {
    if (!NODE_ENV || !validEnvironment.includes(NODE_ENV)) {
        process.env.NODE_ENV = 'localhost';
    }
};

// Define whether the environment is local or production
export const isLocal: boolean = NODE_ENV === 'localhost';
export const isProd: boolean = NODE_ENV === 'production';

// Check environment variables
export const checkEnvironmentVariables = () => {
    const requiredEnvVars = [ 'SENDGRID_FROM_EMAIL', 'DOMAIN_NAME', 'SENDGRID_API_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_BUCKET_NAME'];
    if (isProd) {
        requiredEnvVars.push('STRIPE_WEBHOOK_KEY');
        requiredEnvVars.push('STRIPE_SECRET_KEY');
    } else {
        requiredEnvVars.push('STRIPE_WEBHOOK_KEY_TEST');
        requiredEnvVars.push('STRIPE_SECRET_KEY_TEST');
    }
  
    requiredEnvVars.forEach((envVar) => {
        if (!process.env[envVar]) {
            throw new Error(`${envVar} is not defined`);
        }
    });
};

// Define the domain name
export const DOMAIN_NAME: string = process.env.DOMAIN_NAME || 'resumed.events';

// Define the server URL and environment
type ShortEnvironment = 'local' | 'prod';
const getEnvironmentDomain = (): string => {
    return isProd ? DOMAIN_NAME : `${NODE_ENV}:${PORT}`;
};
const getCurrentEnv = (): ShortEnvironment => {
    return isProd ? 'prod' : 'local';
};
export const SERVER_URL: string = getEnvironmentDomain();
export const FULL_SERVER_URL: string = isProd ? `https://${SERVER_URL}` : `http://${SERVER_URL}`;
export const ENVIRONMENT: ShortEnvironment = getCurrentEnv();

// Define AWS access keys and bucket name
export const AWS_ACCESS_KEY_ID: string | undefined = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY: string | undefined = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION: string | undefined = process.env.AWS_REGION;
export const AWS_BUCKET_NAME: string = process.env.AWS_BUCKET_NAME || `resumed-events-${ENVIRONMENT}`;
export const CDN = `https://s3.us-west-2.amazonaws.com/${AWS_BUCKET_NAME}/template/website/dist`;

// Define Stripe webhook and secret keys
export const STRIPE_WEBHOOK_KEY: string | undefined = isProd ? process.env.STRIPE_WEBHOOK_KEY : process.env.STRIPE_WEBHOOK_KEY_TEST;
export const STRIPE_SECRET_KEY: string | undefined = isProd ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_KEY_TEST;