import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { CustomLoggerService } from '../logger/logger.service';

export interface EmailPayloadInterface {
  to: string;
  subject: string;
  text: string;
  html: string;
  from: string;
}

@Injectable()
export class EmailProviderService {
  constructor(private configService: ConfigService) {
    sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
  }

  async sendEmail(data: EmailPayloadInterface, logger: CustomLoggerService) {
    (data.from = 'team@lightwork.blue'),
      logger.logActivity('sendEmail', '', '', data);

    try {
      await sgMail.send(data);
      console.log('Email sent successfully');

      return { status: 'Email sent successfully' };
    } catch (error) {
      console.error('Error sending email:', error);
      return { status: 'Failed to send email' };
    }
  }
}
