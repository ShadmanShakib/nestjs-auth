import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

enum AddressType {
  HOME = 'HOME',
  WORK = 'WORK',
  JOB = 'JOB',
}

export interface AddressInterface {
  _id?: Types.ObjectId | string;
  refId?: string;
  tag: string;
  addressType: AddressType;
  mainStreet: string;
  building: string;
  country: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  province: string;
  timezone: string;
}

export type AddressDocument = AddressModel & Document;

@Schema({ timestamps: true, collection: 'address' })
export class AddressModel implements AddressInterface {
  @Prop({ type: String })
  refId?: string;

  @Prop({ type: String })
  tag: string;

  @Prop({ type: String, enum: AddressType })
  addressType: AddressType;

  @Prop({ type: String })
  mainStreet: string;

  @Prop({ type: String })
  building: string;

  @Prop({ type: String })
  country: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String })
  postalCode: string;

  @Prop({ type: String })
  timezone: string;

  @Prop({ type: Number })
  latitude: number;

  @Prop({ type: Number })
  longitude: number;

  @Prop({ type: String })
  province: string;
}

export const AddressSchema = SchemaFactory.createForClass(AddressModel);
