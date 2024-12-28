import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserPromptModel, UserPromptSchema } from 'src/model/user_prompt.model';
import { UsersPromptService } from './users_prompt.service';
import { UsersPromptController } from './users_prompt.controller';
import {
  UserPromptMessageModel,
  UserPromptMessageSchema,
} from 'src/model/user_prompt_message.model';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from '../auth/auth.module';
import { CategoryPromptModule } from '../category_prompts/category_prompts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserPromptModel.name, schema: UserPromptSchema },
      { name: UserPromptMessageModel.name, schema: UserPromptMessageSchema },
    ]),
    AuthModule,
    CategoryPromptModule,
    ClientsModule.register([
      {
        name: 'FILE_MANAGER_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'fileManager',
            brokers: [process.env.BROKER_INTERNAL_URI],
          },
          consumer: {
            groupId: 'fileManager-consumer-4791',
          },
        },
      },
    ]),
  ],
  providers: [UsersPromptService],
  controllers: [UsersPromptController],
  exports: [UsersPromptService],
})
export class UsersPromptModule {}
