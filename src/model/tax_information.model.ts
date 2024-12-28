import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

enum TaxClassification {
  INDIVIDUAL = 'INDIVIDUAL',
  GOVERNMENT = 'GOVERNMENT',
}

export interface TaxInformationInterface {
  userId: string;
  countryOfCitizenship: string;
  taxClassification: TaxClassification;
  legalName: string;
  country: string;
  addressId: string;
  postalCode: string;
  city: string;
  taxIdentificationNum: string;
  vatId?: string;
  dateOfBirth: string;
}

export type TaxInfoDocument = TaxInformationModel & Document;

@Schema({ timestamps: true, collection: 'tax_informations' })
export class TaxInformationModel implements TaxInformationInterface {
  @Prop({ type: String })
  userId: string;

  @Prop({ type: String })
  countryOfCitizenship: string;

  @Prop({ type: String, enum: TaxClassification })
  taxClassification: TaxClassification;

  @Prop({ type: String })
  legalName: string;

  @Prop({ type: String })
  vatId: string;

  @Prop({ type: String })
  dateOfBirth: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String })
  postalCode: string;

  @Prop({ type: String })
  taxIdentificationNum: string;

  @Prop({ type: String })
  country: string;

  @Prop({ type: String })
  addressId: string;
}

export const TaxInfoSchema = SchemaFactory.createForClass(TaxInformationModel);
