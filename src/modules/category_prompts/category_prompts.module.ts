import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CategoryPromptModel,
  CategoryPromptSchema,
} from 'src/model/category_prompt.model';
import {
  CategoryPromptMessageModel,
  CategoryPromptMessageSchema,
} from 'src/model/category_prompt_message.model';
import { CategoryPromptService } from './category_prompts.service';
import { CategoryPromptController } from './category_prompts.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CategoryPromptModel.name, schema: CategoryPromptSchema },
      {
        name: CategoryPromptMessageModel.name,
        schema: CategoryPromptMessageSchema,
      },
    ]),
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
            groupId: 'fileManager-consumer-2230',
          },
        },
      },
    ]),
  ],
  providers: [CategoryPromptService],
  controllers: [CategoryPromptController],
  exports: [CategoryPromptService],
})
export class CategoryPromptModule {}
