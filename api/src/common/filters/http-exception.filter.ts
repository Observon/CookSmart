import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string | string[] = exception.message;
    let error: string | undefined;
    let additional: Record<string, unknown> = {};

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const {
        message: responseMessage,
        error: responseError,
        ...rest
      } = exceptionResponse as Record<string, unknown>;

      if (responseMessage !== undefined) {
        message = responseMessage as string | string[];
      } else if (responseError !== undefined) {
        message = responseError as string;
      }

      if (typeof responseError === 'string') {
        error = responseError;
      }

      additional = rest;
    }

    if (Array.isArray(message)) {
      const uniqueMessages = Array.from(
        new Set(
          message
            .map((item) => (typeof item === 'string' ? item : String(item)))
            .filter((item) => item.trim().length > 0),
        ),
      );
      message = uniqueMessages.length > 0 ? uniqueMessages : exception.message;
    } else {
      message = message ? String(message) : exception.message;
    }

    if (
      typeof message === 'string' &&
      typeof error === 'string' &&
      message.trim() === error.trim()
    ) {
      error = undefined;
    }

    const payload: Record<string, unknown> = {
      path: request?.url,
      ...additional,
      statusCode: status,
      message,
    };

    if (error !== undefined) {
      payload.error = error;
    }

    response.status(status).json(payload);
  }
}
