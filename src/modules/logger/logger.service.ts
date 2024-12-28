import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CustomLoggerService extends Logger {
  logActivity(
    action: string,
    userId: string,
    userRole: string,
    additionalInfo?: any,
  ) {
    const message = `Action: ${action}, UserID: ${userId}, UserRole: ${userRole}, Additional Info: ${JSON.stringify(additionalInfo)}`;

    // Use the built-in log method or any other method like debug, warn, error based on your needs
    this.log(message);
  }
}
