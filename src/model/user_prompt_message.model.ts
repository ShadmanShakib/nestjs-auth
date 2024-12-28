import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface UserPromptMessageInterface {
  _id?: string;
  message: string;
  userId: string;
}

export type UserPromptMessageDocument = UserPromptMessageModel & Document;

@Schema({ timestamps: true, collection: 'user_prompt_messages' })
export class UserPromptMessageModel implements UserPromptMessageInterface {
  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, required: true })
  userId: string;
}

export const UserPromptMessageSchema = SchemaFactory.createForClass(
  UserPromptMessageModel,
);
