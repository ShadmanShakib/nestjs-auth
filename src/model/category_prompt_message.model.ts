import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface CategoryPromptMessageInterface {
  _id?: string;
  message: string;
  categoryId: string;
}

export type CategoryPromptMessageDocument = CategoryPromptMessageModel &
  Document;

@Schema({ timestamps: true, collection: 'category_prompt_messages' })
export class CategoryPromptMessageModel
  implements CategoryPromptMessageInterface
{
  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, required: true })
  categoryId: string;
}

export const CategoryPromptMessageSchema = SchemaFactory.createForClass(
  CategoryPromptMessageModel,
);
