import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from '../logger/logger.module';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';

import { UsersModel, UsersSchema } from 'src/model/users.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UsersModel.name, schema: UsersSchema }]),
    LoggerModule,
  ],
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantModule {}
