import type { Params } from 'nestjs-pino';

export function pinoConfig(): Params {
  const isProduction = process.env.NODE_ENV === 'production';
  const level = process.env.LOG_LEVEL || 'info';

  return {
    pinoHttp: {
      level,
      autoLogging: true,
      customProps: () => ({ context: 'HTTP' }),
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      ...(isProduction
        ? {}
        : {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'SYS:HH:MM:ss.l',
              },
            },
          }),
    },
  };
}
