import type { Params } from 'nestjs-pino';

export function pinoHttpConfig(): Params {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    pinoHttp: {
      level: process.env.LOG_LEVEL || 'info',
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
