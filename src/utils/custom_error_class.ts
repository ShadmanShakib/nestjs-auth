import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomHttpException extends HttpException {
  constructor(message: string | object, statusCode: HttpStatus) {
    super(message, statusCode);
  }

  static notFound(message: string = 'Resource not found') {
    return new CustomHttpException(message, HttpStatus.NOT_FOUND);
  }

  static forbidden(message: string = 'Access denied') {
    return new CustomHttpException(message, HttpStatus.FORBIDDEN);
  }

  static badRequest(message: string = 'Invalid request') {
    return new CustomHttpException(message, HttpStatus.BAD_REQUEST);
  }

  static internalServerError(message: string = 'Internal server error') {
    return new CustomHttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
