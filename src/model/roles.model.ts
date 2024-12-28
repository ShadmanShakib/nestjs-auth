import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface RolesInterface {
  _id?: string;
  name: string;
  permissionIds: Types.ObjectId[];
  roleType?: string;
  module?: string;
  propertyId?: string;
  isDefault: boolean;
  deleted_at?: Date;
}


export enum RoleType {
  MAIN,
  EXTRA
}


export enum ModuleType {
  PROPERTY,
  TENANT
}
export type RolesDocument = RolesModel & Document;

@Schema({ timestamps: true, collection: 'roles' })
export class RolesModel implements RolesInterface {


  @Prop({ type: String })
  name: string;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'user_permissions' }] })
  permissionIds: Types.ObjectId[];

  @Prop({ type: String, enum: RoleType })
  roleType: string

  @Prop({ type: String })
  propertyId?: string

  @Prop({ type: String, enum: ModuleType })
  module: string

  @Prop({ type: Date })
  deleted_at?: Date;
}

export const RolesSchema = SchemaFactory.createForClass(RolesModel);

// Table Roles {
//   id UUID [pk]
//   name varchar
//   roleType RoleType
//   module ModuleType
//   refId string  // It could be property Id ,tenant Id or any id which need extra roles.
//   permissionIds array
// }

