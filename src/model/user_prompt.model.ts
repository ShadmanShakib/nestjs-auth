import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface UserPromptInterface {
  _id?: string;
  messageId: string;
  userId: string;
}

export type UserPromptDocument = UserPromptModel & Document;

@Schema({ timestamps: true, collection: 'user_prompts' })
export class UserPromptModel implements UserPromptInterface {
  @Prop({ type: String, required: true })
  messageId: string;

  @Prop({ type: String, required: true })
  userId: string;
}

export const UserPromptSchema = SchemaFactory.createForClass(UserPromptModel);
