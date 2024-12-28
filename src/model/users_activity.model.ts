import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UsersActivityType {
  VIEWINGS = 'VIEWINGS',
  WORK_ORDERS = 'WORK_ORDERS',
  QUOTES = 'QUOTES',
  COMPLIANCES = 'COMPLIANCES',
  CONVERSATIONS = 'CONVERSATIONS',
  TASKS = 'TASKS',
  OTHERS = 'OTHERS',
}

export interface UsersActivityInterface {
  _id?: Types.ObjectId | string;
  id?: string;
  userId: string;
  title: string;
  companyId: string;
  activityType: UsersActivityType;
  detail: string;
  refId?: string;
  metadata?: Record<string, any>[];
}

export type UsersActivityDocument = UsersActivityModel & Document;

@Schema({ timestamps: true, collection: 'users_activity' })
export class UsersActivityModel implements UsersActivityInterface {
  @Prop({ type: String })
  userId: string;

  @Prop({ type: String })
  companyId: string;

  @Prop({ type: String })
  title: string;

  @Prop({ type: String })
  refId?: string;

  @Prop({ type: String, enum: UsersActivityType })
  activityType: UsersActivityType;

  @Prop({ type: String })
  detail: string;

  @Prop({ type: [Object], default: [] })
  metadata: Record<string, any>[];
}

export const UsersActivitySchema =
  SchemaFactory.createForClass(UsersActivityModel);
