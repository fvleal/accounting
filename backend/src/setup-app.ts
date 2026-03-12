import {
  INestApplication,
  ValidationPipe,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtAuthGuard } from './shared/infrastructure/auth/index.js';
import { DomainExceptionFilter } from './account/interface/filters/domain-exception.filter.js';
import { ResponseEnvelopeInterceptor } from './account/interface/interceptors/response-envelope.interceptor.js';

export function setupApp(app: INestApplication): void {
  app.useGlobalGuards(app.get(JwtAuthGuard));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new UnprocessableEntityException(
          errors.map((e) => ({
            field: e.property,
            message: Object.values(e.constraints ?? {}).join(', '),
          })),
        ),
    }),
  );

  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
}
