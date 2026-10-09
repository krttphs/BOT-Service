import { HttpException } from '@nestjs/common';

export class BotApiException extends HttpException {
  constructor(
    code: string,
    message: string,
    status: number,
  ) {
    super({ success: false, error_code: code, message }, status);
  }
}
