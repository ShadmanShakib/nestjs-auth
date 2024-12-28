import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AddressInterface } from './address.model';

enum Visibility {
  PUBLIC = 'PUBLIC',
  ONLY_LIGHTWORK_USERS = 'ONLY_LIGHTWORK_USERS',
  PRIVATE = 'PRIVATE',
}

enum ContractPreference {
  BOTH_SHORT_TERM_AND_LONG_TERM_PROJECTS = 'BOTH_SHORT_TERM_AND_LONG_TERM_PROJECTS',
  LONG_TERM_PROJECTS_GREATER_THAN_3_MONTHS = 'LONG_TERM_PROJECTS_GREATER_THAN_3_MONTHS',
  SHORT_TERM_PROJECTS_LESS_THAN_3_MONTHS = 'SHORT_TERM_PROJECTS_LESS_THAN_3_MONTHS',
  HOURLY = 'HOURLY',
  FIXED_PRICE = 'FIXED_PRICE',
}

enum JoiningReason {
  'FOR_LEADS',
  'FOR_MANAGEMENT',
}

interface CategoriesInterface {
  name: string;
  content: string[];
}

@Schema()
class CategoriesModel {
  @Prop({ type: String })
  name: string;

  @Prop({ type: [String] }) // Ensure this is an array of strings
  content: string[];
}

const CategoriesSchema = SchemaFactory.createForClass(CategoriesModel);

export interface UsersProfileInterface {
  _id?: Types.ObjectId | string;
  userId?: string;
  idVerification?: boolean;
  isOnline?: boolean;
  address?: AddressInterface;
  formattedAddress?: string;
  addressId?: string;
  imageUrl?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  hourlyRate?: number;
  skills?: string[];
  companyId?: string;
  companyName?: string;
  visualVerification?: boolean;
  qualificationVerification?: boolean;
  assistantId?: string;
  qualificationName?: string;
  assistantPhoneNo?: string;
  assistantEmail?: string;
  visibility?: Visibility;
  contractPreference?: ContractPreference;
  businessDays?: string[];
  businessTimes?: string[];
  categories?: CategoriesInterface[];
  schedules?: string[];
  avgRating?: number;
  experienceNum?: number;
  totalJobs?: number;
  mileRadiusPref: number;
  language?: string;
  yearsInBusiness?: number;
  reasonOfJoining?: JoiningReason;
  callOutFee?: string;
  areasCovered: string[];
}

export type UsersProfileDocument = UsersProfileModel & Document;

@Schema({ timestamps: true, collection: 'user_profiles' })
export class UsersProfileModel implements UsersProfileInterface {
  @Prop()
  userId: string;

  @Prop({ type: String, enum: Visibility })
  visibility: Visibility;

  @Prop({ type: Boolean })
  idVerification: boolean;

  @Prop({ type: Array<string> })
  skills: string[];

  @Prop({ type: Array<string> })
  areasCovered: string[];

  @Prop({ type: Number })
  profile_completeness_num: number;

  @Prop({ type: Boolean })
  isOnline: boolean;

  @Prop({ type: Number })
  hourlyRate: number;

  @Prop({ type: Number })
  mileRadiusPref: number;

  @Prop({ type: String })
  bio: string;

  @Prop({ type: String })
  formattedAddress: string;

  @Prop({ type: String })
  assistantPhoneNo: string;

  @Prop({ type: String })
  assistantEmail: string;

  @Prop({ type: String })
  assistantId: string;

  @Prop({ type: String })
  imageUrl?: string;

  @Prop({ type: String })
  addressId: string;

  @Prop({ type: String })
  companyId?: string;

  @Prop({ type: Boolean })
  visualVerification: boolean;

  @Prop({ type: Boolean })
  qualificationVerification: boolean;

  @Prop({ type: String })
  qualificationName: string;

  @Prop({ type: String, enum: ContractPreference })
  contractPreference: ContractPreference;

  @Prop({ type: Array<string> })
  businessDays: string[];

  @Prop({ type: Array<string> })
  businessTimes: string[];

  @Prop({ type: [CategoriesSchema] }) // This correctly embeds the schema
  categories: Types.DocumentArray<CategoriesModel>;

  @Prop({ type: Number })
  avgRating: number;

  @Prop({ type: Array<string> })
  schedules: string[];

  @Prop({ type: Number })
  experienceNum: number;

  @Prop({ type: Number })
  totalJobs: number;

  @Prop({ type: String, enum: JoiningReason })
  reasonOfJoining?: JoiningReason;

  @Prop({ type: String })
  callOutFee?: string;

  @Prop({ type: Number })
  yearsInBusiness: number;

  @Prop({ type: String })
  language: string;
}

export const UsersProfileSchema =
  SchemaFactory.createForClass(UsersProfileModel);
