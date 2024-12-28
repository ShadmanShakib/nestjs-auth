import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AddressInterface } from './address.model';

enum CompanyType {
  CONTRACTOR = 'CONTRACTOR',
  PROPERTY_MANAGEMENT = 'PROPERTY_MANAGEMENT',
  SOLE_PROPRIETORY = 'SOLE_PROPRIETORY',
  SUPPLIER_COMPANY = 'SUPPLIER_COMPANY',
}

enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface CompaniesInterface {
  _id?: string;
  addressId: string;
  name?: string;
  bio?: string;
  size: string;
  ownerId: string;
  type: CompanyType;
  status: CompanyStatus;
  address?: AddressInterface;
  phoneNumber?: string;
  imageUrl?: string;
  deleted_at?: Date;
  contactNumber?: string;
  companyUrl?: string;
  metadata?: string;
  categoryId?: string;
  categoryName?: string;
}

export type CompaniesDocument = CompaniesModel & Document;

@Schema({ timestamps: true, collection: 'companies' })
export class CompaniesModel implements CompaniesInterface {
  @Prop({ type: String })
  addressId: string;

  @Prop({ type: String })
  ownerId: string;

  @Prop({ type: String })
  categoryId: string;

  @Prop({ type: String })
  categoryName: string;

  @Prop({ type: String })
  metadata: string;

  @Prop({ type: String })
  imageUrl: string;

  @Prop({ type: String })
  companyUrl: string;

  @Prop({ type: String })
  size: string;

  @Prop({ type: String })
  bio: string;

  @Prop({ type: String })
  phoneNumber: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  contactNumber: string;

  @Prop({ type: String, enum: CompanyStatus })
  status: CompanyStatus;

  @Prop({ type: String, enum: CompanyType })
  type: CompanyType;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const CompaniesSchema = SchemaFactory.createForClass(CompaniesModel);
