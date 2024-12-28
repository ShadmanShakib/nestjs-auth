import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface UserPermissionsInterface {
  _id?: string;
  name: string;
  operation: string;
  description: string;
  deleted_at?: Date;
}

export type UserPermissionsDocument = UserPermissionsModel & Document;

@Schema({ timestamps: true, collection: 'user_permissions' })
export class UserPermissionsModel implements UserPermissionsInterface {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  operation: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Date })
  deleted_at?: Date;
}

export const UserPermissionsSchema =
  SchemaFactory.createForClass(UserPermissionsModel);

