import { HttpException, Logger } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import { DomainException } from '../../../shared/domain/exceptions/domain-exception.base.js';

class TestDomainException extends DomainException {
  readonly code = 'TEST_ERROR';
}

function createMockHost(): ArgumentsHost {
  const response: any = {};
  response.status = vi.fn().mockReturnValue(response);
  response.json = vi.fn().mockReturnValue(response);

  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({}),
      getNext: () => vi.fn(),
    }),
    getArgs: vi.fn(),
    getArgByIndex: vi.fn(),
    switchToRpc: vi.fn(),
    switchToWs: vi.fn(),
    getType: vi.fn(),
  } as unknown as ArgumentsHost;
}

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    filter = new DomainExceptionFilter();
    loggerErrorSpy = vi
      .spyOn((filter as any).logger, 'error')
      .mockImplementation(() => {});
  });

  it('logs unhandled (non-domain, non-HTTP) exception via logger.error', () => {
    const host = createMockHost();
    const error = new Error('boom');

    filter.catch(error, host);

    expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('boom'),
      'UnhandledException',
    );
  });

  it('returns 500 JSON response for unhandled exception', () => {
    const host = createMockHost();
    const response = host.switchToHttp().getResponse();

    filter.catch(new Error('boom'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: null,
    });
  });

  it('does NOT log domain exceptions via logger.error', () => {
    const host = createMockHost();
    const exception = new TestDomainException('test error');

    filter.catch(exception, host);

    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });

  it('does NOT log HTTP exceptions via logger.error', () => {
    const host = createMockHost();
    const exception = new HttpException('Not Found', 404);

    filter.catch(exception, host);

    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });

  it('logs non-Error unhandled exceptions as strings', () => {
    const host = createMockHost();

    filter.catch('string error', host);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'string error',
      'UnhandledException',
    );
  });
});
