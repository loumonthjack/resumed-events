// verify process.env
type NodeEnv = keyof typeof NODE_ENV_MAP;
type NodeEnvShort = (typeof NODE_ENV_MAP)[NodeEnv];

const NODE_ENV_MAP = {
  localhost: "local",
  development: "dev",
  production: "prod",
} as const;

export const NODE_ENV: NodeEnv = __ASSERT__isValid(
  process.env.NODE_ENV,
  isValidNodeEnv,
  `[env] invalid NODE_ENV:${
    process.env.NODE_ENV
  }, should be one of ${Object.keys(NODE_ENV_MAP)}`
);

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
