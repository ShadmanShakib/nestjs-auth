import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// _id              ObjectId [pk]
// name             varchar    -- Skill name, e.g., plumbing, electrical, leasing
// group            varchar    -- ENUM: MAINTENANCE, LEASING, ADMINISTRATION, IT, FINANCE
// }
enum SkillsGroup {
  MAINTENANCE = 'MAINTENANCE',
  LEASING = 'LEASING',
  ADMINISTRATION = 'ADMINISTRATION',
  IT = 'IT',
  FINANCE = 'FINANCE',
}
export interface SkillsInterface {
  _id?: string;
  name: string;
  group: SkillsGroup;
}

export type SkillsDocument = SkillsModel & Document;

@Schema({ timestamps: true, collection: 'skills' })
export class SkillsModel implements SkillsInterface {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String, enum: SkillsGroup })
  group: SkillsGroup;
}

export const RolesSchema = SchemaFactory.createForClass(SkillsModel);
