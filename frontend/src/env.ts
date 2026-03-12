const requiredEnvVars = [
  'VITE_AUTH0_DOMAIN',
  'VITE_AUTH0_CLIENT_ID',
  'VITE_AUTH0_AUDIENCE',
  'VITE_API_URL',
] as const;

const optionalEnvVars = [
  'VITE_LOGO_URL',
  'VITE_COMPANY_NAME',
] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\nCheck your .env.local file against .env.example`
    );
  }
}

export function getEnvStatus() {
  return {
    required: requiredEnvVars.map((key) => ({
      key,
      set: !!import.meta.env[key],
    })),
    optional: optionalEnvVars.map((key) => ({
      key,
      set: !!import.meta.env[key],
    })),
  };
}
