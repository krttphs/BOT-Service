import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { Request, Response } from 'express';

// @Catch() เปล่า = ดักทุก exception ไม่ใช่แค่ HttpException
// ทำให้ error ที่ไม่ได้ตั้งใจ (TypeError ฯลฯ) กลายเป็น 500 สะอาด
// ไม่หลุด stack trace ออกไปหา client
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message = 'เกิดข้อผิดพลาดภายในระบบ';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const responseMessage = (
          exceptionResponse as { message?: string | string[] }
        ).message;

        message = Array.isArray(responseMessage)
          ? responseMessage.join(', ')
          : (responseMessage ?? exception.message);
      } else {
        message = exception.message;
      }

      if (status === 400) error = 'Bad Request';
      else if (status === 404) error = 'Not Found';
      else if (status === 502) error = 'Bad Gateway';
      else if (status >= 500) error = 'Internal Server Error';
      else error = exception.name;
    } else {
      // error ที่ไม่ใช่ HttpException: log ไว้ฝั่ง server เท่านั้น
      // ไม่ส่งรายละเอียด/stack ออกไปหา client
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      timestamp: new Date().toISOString(),
      status,
      error,
      message,
      path: request.url,
    });
  }
}
