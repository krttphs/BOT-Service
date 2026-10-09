import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

// ชนิดข้อมูลเอกสาร BIBOR Rate
export type BiborRateDocument = HydratedDocument<BiborRate>;

// Schema สำหรับ Collection bibor_rates
@Schema({
  collection: 'bibor_rates',
  timestamps: true,
})
export class BiborRate {
  // ตัวอย่าง: 2025-06-30
  @Prop()
  period: string;

  @Prop()
  date: string;

  @Prop({ type: SchemaTypes.Mixed })
  overnight: number | string;

  @Prop({ type: SchemaTypes.Mixed })
  month_1: number | string;

  @Prop({ type: SchemaTypes.Mixed })
  month_3: number | string;

  @Prop({ type: SchemaTypes.Mixed })
  month_6: number | string;

  @Prop({ type: SchemaTypes.Mixed })
  month_12: number | string;

  @Prop({ type: SchemaTypes.Mixed })
  avg_rate: number | string;
}

export const BiborRateSchema = SchemaFactory.createForClass(BiborRate);

BiborRateSchema.index({ period: 1 });