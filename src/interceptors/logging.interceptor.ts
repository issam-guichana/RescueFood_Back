import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query } = request;
    const now = Date.now();

    this.logger.log(`📨 Incoming Request: ${method} ${url}`);
    if (Object.keys(params).length > 0) {
      this.logger.debug(`   Params: ${JSON.stringify(params)}`);
    }
    if (Object.keys(query).length > 0) {
      this.logger.debug(`   Query: ${JSON.stringify(query)}`);
    }
    if (Object.keys(body).length > 0) {
      this.logger.debug(`   Body: ${JSON.stringify(body)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - now;
          this.logger.log(
            `✅ Response: ${method} ${url} - Status: ${response.statusCode} - ${delay}ms`,
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          this.logger.error(
            `❌ Error: ${method} ${url} - ${error.message} - ${delay}ms`,
            error.stack,
          );
        },
      }),
    );
  }
}
