import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getWelcomePage(
    @Query('user_id') user_id: string,
    @Query('user_role') user_role: string,
  ): string {
    return this.appService.getWelcomePage(user_id, user_role);
  }

  @EventPattern('auth-event-test')
  testAuthEvent() {
    console.log(
      '<<<<< WELCOME TO AUTH SERVICE:: KAFKA EVENT WORKING [(|)] >>>',
    );
  }
}
