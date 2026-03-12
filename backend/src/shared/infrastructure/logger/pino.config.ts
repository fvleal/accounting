import type { Params } from 'nestjs-pino';

export function pinoConfig(): Params {
  const isProduction = process.env.NODE_ENV === 'production';
  const level = process.env.LOG_LEVEL || 'info';
  const lokiUrl = process.env.LOKI_URL || 'http://localhost:3100';
  const env = isProduction ? 'production' : 'development';

  const lokiTarget = {
    target: 'pino-loki',
    options: {
      host: lokiUrl,
      batching: true,
      interval: 2,
      labels: { app: 'accounting-backend', env },
    },
    level,
  };

  const prettyTarget = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: true,
      translateTime: 'SYS:HH:MM:ss.l',
    },
    level,
  };

  const targets = isProduction
    ? [lokiTarget]
    : [prettyTarget, lokiTarget];

  return {
    pinoHttp: {
      level,
      autoLogging: true,
      customProps: () => ({ context: 'HTTP' }),
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      transport: { targets },
    },
  };
}
