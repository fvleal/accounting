import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './account/interface/filters/domain-exception.filter.js';
import { ResponseEnvelopeInterceptor } from './account/interface/interceptors/response-envelope.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
