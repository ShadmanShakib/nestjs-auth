import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UsersActivityService } from './users_activity.service';
import { UsersActivityInterface } from 'src/model/users_activity.model';

@Controller('activities')
export class UsersActivityController {
  constructor(private readonly usersActivityService: UsersActivityService) {}

  @Get()
  async getUsersActivities(@Query() query: Record<string, any>) {
    return await this.usersActivityService.getUsersActivity(query);
  }

  @Post()
  async createUserActivity(
    @Body() payload: UsersActivityInterface,
    @Query() query: Record<string, any>,
  ) {
    return await this.usersActivityService.createUserActivity(payload);
  }
}
