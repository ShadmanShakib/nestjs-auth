import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface CategoryPromptInterface {
  _id?: string;
  categoryId: string;
  messageId: string;
}

export type CategoryPromptDocument = CategoryPromptModel & Document;

@Schema({ timestamps: true, collection: 'category_prompts' })
export class CategoryPromptModel implements CategoryPromptInterface {
  @Prop({ type: String, required: true })
  categoryId: string;

  @Prop({ type: String, required: true })
  messageId: string;
}

export const CategoryPromptSchema =
  SchemaFactory.createForClass(CategoryPromptModel);
