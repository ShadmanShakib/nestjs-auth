import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserType {
  SOLE_TRADER = 'SOLE_TRADER',
  TENANT = 'TENANT',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  HOMEOWNER = 'HOMEOWNER',
  CONTRACTOR = 'CONTRACTOR',
  ADMIN = 'ADMIN',
  STAFF_TECHNICIANS = 'STAFF_TECHNICIANS',
  SUPPLIERS = 'SUPPLIERS',
  AI_ASSISTANT = 'AI_ASSISTANT',
}

export enum UserStatus {
  INVITED = 'INVITED',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface UsersInterface {
  _id?: Types.ObjectId | string;
  username: string;
  profileId?: string;
  userType: UserType;
  isContractorCompanyManaged?: boolean;
  addressId?: string;
  phoneNumber?: string;
  email: string;
  firstName: string;
  firebaseUid?: string;
  lastName: string;
  password?: string;
  providerId?: string;
  stripeConnectVerif?: boolean;
  phone?: string;
  stripeConnectId?: string;
  stripeCustomerId?: string;
  imageUrl: string;
  awayCompanyName: string;
  awayCompanyUrl: string;
  status: UserStatus;
  companyId?: string;
  taxInfoId?: string;
  createdBy?: string;
  deleted_at: Date | undefined;
  emergencyContactName?: string;
  emergencyPhoneNumber?: string;
  dateOfBirth?: Date;
  skills: string[];
  specializations: string[];
}

export type UsersDocument = UsersModel & Document;

@Schema({ timestamps: true, collection: 'users' })
export class UsersModel implements UsersInterface {
  @Prop({ type: String })
  username: string;

  @Prop({ type: String, enum: UserType })
  userType: UserType;

  @Prop({ type: String })
  taxInfoId: string;

  @Prop({ type: String })
  createdBy?: string;

  @Prop({ String })
  addressId: string;

  @Prop({ type: String })
  stripeConnectId?: string;

  @Prop({ type: Boolean, default: false })
  stripeConnectVerif?: boolean;

  @Prop({ type: String })
  stripeCustomerId?: string;

  @Prop({ type: String })
  firebaseUid: string;

  @Prop({ type: String })
  profileId: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  awayCompanyName: string;


  @Prop({ type: String })
  awayCompanyUrl: string;

  @Prop({ type: String })
  password?: string;

  @Prop({ type: String })
  firstName: string;

  @Prop({ type: String })
  lastName: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String })
  imageUrl: string;

  @Prop({ type: String })
  providerId: string;

  @Prop({ type: String })
  companyId: string;

  @Prop({ type: String, enum: UserStatus })
  status: UserStatus;

  @Prop({ type: Date })
  deleted_at: Date;

  @Prop({ type: String })
  emergencyContactName: string;

  @Prop({ type: String })
  emergencyPhoneNumber: string;

  @Prop({ type: Date })
  dateOfBirth: Date;

  @Prop({ type: Array<string> })
  skills: string[];

  @Prop({ type: Array<string> })
  specializations: string[];
}

export const UsersSchema = SchemaFactory.createForClass(UsersModel);
