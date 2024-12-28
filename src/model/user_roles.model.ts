import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface UserRolesInterface {
  _id?: string;
  userId: string;
  roleId: string;
  propertyId?: string;
  deleted_at?: Date;
}

export type UsersRolesDocument = UserRolesModel & Document;

@Schema({ timestamps: true, collection: 'user_roles' })
export class UserRolesModel implements UserRolesInterface {
  @Prop({ type: String })
  roleId: string;

  @Prop({ type: String })
  userId: string;

  @Prop({ type: String })
  propertyId: string;

  @Prop({ type: Date })
  deleted_at?: Date;
}

export const userRolesSchema = SchemaFactory.createForClass(UserRolesModel);
