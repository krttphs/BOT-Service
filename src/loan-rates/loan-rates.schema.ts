import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// ชนิดข้อมูลเอกสาร Loan Rate
export type LoanRateDocument = HydratedDocument<LoanRate>;

// Schema สำหรับ Collection loan_rates
@Schema({
  collection: 'loan_rates',
  timestamps: true,
})
export class LoanRate {
  // ตัวอย่าง: 2025-01-15
  @Prop({ required: true })
  period: string;

  @Prop()
  bank_type_name_th: string;

  @Prop()
  bank_type_name_eng: string;

  @Prop({ required: true })
  bank_name_th: string;

  @Prop()
  bank_name_eng: string;

  @Prop()
  mor: string;

  @Prop()
  mlr: string;

  @Prop()
  mrr: string;

  @Prop()
  default_rate: string;
}

export const LoanRateSchema = SchemaFactory.createForClass(LoanRate);

// ป้องกันข้อมูลซ้ำของ bank_name_th และ period
LoanRateSchema.index({ bank_name_th: 1, period: 1 }, { unique: true });