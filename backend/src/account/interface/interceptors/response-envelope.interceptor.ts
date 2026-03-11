import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ListShape {
  data: unknown[];
  total: number;
  offset?: number;
  limit?: number;
}

function isListResponse(data: unknown): data is ListShape {
  return (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    Array.isArray((data as ListShape).data) &&
    'total' in data &&
    typeof (data as ListShape).total === 'number'
  );
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (isListResponse(data)) {
          return {
            data: data.data,
            meta: {
              total: data.total,
              offset: data.offset ?? 0,
              limit: data.limit ?? data.data.length,
              timestamp: new Date().toISOString(),
            },
          };
        }

        return {
          data,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
