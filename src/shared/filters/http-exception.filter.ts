import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let responseBody: any = { message: 'Internal server error' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      responseBody = exception.getResponse();
    }

    // Log detailed info for validation errors
    if (status === 400) {
      this.logger.warn(`400 Validation error on ${request.method} ${request.url}`);
      this.logger.warn(JSON.stringify(responseBody, null, 2));
    } else {
      this.logger.error(`Exception on ${request.method} ${request.url}: ${JSON.stringify(responseBody)}`);
      if (exception instanceof Error) {
        this.logger.error(exception.stack);
      }
    }

    response.status(status).json(responseBody);
  }
}
