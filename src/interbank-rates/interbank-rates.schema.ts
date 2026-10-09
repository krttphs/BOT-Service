import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// ชนิดข้อมูลเอกสาร Interbank Rate
export type InterbankRateDocument = HydratedDocument<InterbankRate>;

// Schema สำหรับ Collection interbank_rates
@Schema({
  collection: 'interbank_rates',
  timestamps: true,
})
export class InterbankRate {
  // ตัวอย่าง: 2025-01-15
  @Prop({ required: true })
  period: string;

  @Prop()
  term_type_name_th: string;

  @Prop()
  term_type_name_eng: string;

  @Prop()
  term_type_th: string;

  @Prop()
  term_type_eng: string;

  @Prop()
  min_interest_rate: string;

  @Prop()
  min_rate: string;

  @Prop()
  max_interest_rate: string;

  @Prop()
  max_rate: string;

  @Prop()
  mode_interest_rate: string;

  @Prop()
  weighted_average_interest_rate: string;

  @Prop()
  weighted_avg_interbank_rate: string;

  @Prop()
  avg_rate: string;
}

export const InterbankRateSchema =
  SchemaFactory.createForClass(InterbankRate);

// ป้องกันข้อมูลซ้ำของ period และ term_type_name_eng
InterbankRateSchema.index(
  { period: 1, term_type_name_eng: 1 },
  { unique: true },
);