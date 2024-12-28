import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UsersProfileModel,
  UsersProfileSchema,
} from 'src/model/users_profile.model';
import { UsersProfileService } from './users_profile.service';
import { LoggerModule } from '../logger/logger.module';
import { UsersAddressModule } from '../address/address.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsersProfileModel.name, schema: UsersProfileSchema },
    ]),
    LoggerModule,
    UsersAddressModule,
    ClientsModule.register([
      {
        name: 'AI_ASSISTANT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'ai_assistant',
            brokers: [process.env.BROKER_INTERNAL_URI],
          },
          consumer: {
            groupId: 'ai-assistant-consumer',
          },
        },
      },
    ]),
  ],
  providers: [UsersProfileService],
  controllers: [],
  exports: [UsersProfileService],
})
export class UsersProfileModule {}
