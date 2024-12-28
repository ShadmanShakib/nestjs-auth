import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

@Injectable()
export class TwilioProviderService {
  private twilioClient: Twilio.Twilio;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioClient = Twilio(accountSid, authToken);
  }

  async sendSms(to: string, body: string): Promise<any> {
    return this.twilioClient.messages.create({
      body: body,
      to: to,
      from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
    });
  }

  public async buyPhoneNumber(): Promise<any> {
    try {
      const availableNumbers = await this.twilioClient
        .availablePhoneNumbers('GB')
        .mobile.list({
          voiceEnabled: true,
          smsEnabled: true,
          limit: 2,
        });
      if (!availableNumbers.length) {
        throw new Error('No available numbers found for this area code.');
      }

      const numberToBuy = availableNumbers[0].phoneNumber;
      const purchasedNumber =
        await this.twilioClient.incomingPhoneNumbers.create({
          phoneNumber: numberToBuy,
          voiceUrl: process.env.TWILIO_WEBHOOK_CALL_URL,
          voiceMethod: 'POST',
          smsUrl: process.env.TWILIO_WEBHOOK_SMS_URL,
          smsMethod: 'POST',
          addressSid: process.env.TWILIO_ADDRESS_SID,
          bundleSid: process.env.TWILIO_BUNDLE_SID,
        });

      return purchasedNumber;
    } catch (error) {
      throw new Error(`Failed to purchase number: ${error.message}`);
    }
  }
}
