import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from '../logger/logger.module';
import { UsersActivityModel, UsersActivitySchema } from 'src/model/users_activity.model';
import { UsersActivityService } from './users_activity.service';
import { UsersActivityController } from './users_activity.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UsersActivityModel.name, schema: UsersActivitySchema }]),
    LoggerModule,
  ],
  providers: [UsersActivityService],
  controllers: [UsersActivityController],
  exports: [UsersActivityService],
})
export class UsersActivityModule {}