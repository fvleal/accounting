import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '../../../shared/domain/exceptions/domain-exception.base.js';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  private static readonly CODE_TO_STATUS: Record<string, number> = {
    ACCOUNT_NOT_FOUND: 404,
    ACCOUNT_OWNERSHIP_VIOLATION: 403,
    DUPLICATE_EMAIL: 409,
    DUPLICATE_CPF: 409,
  };

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof DomainException) {
      const statusCode =
        DomainExceptionFilter.CODE_TO_STATUS[exception.code] ?? 422;
      response.status(statusCode).json({
        statusCode,
        error: exception.code,
        message: exception.message,
        details: exception.metadata,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();

      if (statusCode === 422) {
        const exceptionResponse = exception.getResponse();
        response.status(422).json({
          statusCode: 422,
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: exceptionResponse,
        });
        return;
      }

      response.status(statusCode).json({
        statusCode,
        error: exception.name,
        message: exception.message,
        details: null,
      });
      return;
    }

    this.logger.error(
      exception instanceof Error
        ? exception.stack || exception.message
        : String(exception),
      'UnhandledException',
    );
    response.status(500).json({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: null,
    });
  }
}
