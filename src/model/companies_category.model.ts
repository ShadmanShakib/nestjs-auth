import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface CompaniesCategoryInterface {
  _id?: string;
  name: string;
  tags?: string[];
}

export type CompaniesCategoryDocument = CompaniesCategoryModel & Document;

@Schema({ timestamps: true, collection: 'categories_companies' })
export class CompaniesCategoryModel implements CompaniesCategoryInterface {
  @Prop({ type: String })
  name: string;

  @Prop({ type: Array<string> })
  tags: string[];
}

export const CompaniesCategorySchema = SchemaFactory.createForClass(
  CompaniesCategoryModel,
);
