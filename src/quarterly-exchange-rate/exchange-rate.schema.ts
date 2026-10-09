import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// ชนิดข้อมูลเอกสาร Exchange Rate
export type ExchangeRateDocument = HydratedDocument<ExchangeRate>;

// Schema สำหรับ Collection exchange_rates
@Schema({
  collection: 'exchange_rates',
  timestamps: true,
})
export class ExchangeRate {
  // ตัวอย่าง: 2025-Q2
  @Prop({ required: true })
  period: string;

  // ตัวอย่าง: USD
  @Prop({ required: true })
  currency_id: string;

  @Prop()
  currency_name_th: string;

  @Prop()
  currency_name_eng: string;

  @Prop()
  buying_sight: string;

  @Prop()
  buying_transfer: string;

  @Prop()
  selling: string;

  @Prop({ required: true })
  mid_rate: string;
}

export const ExchangeRateSchema =
  SchemaFactory.createForClass(ExchangeRate);

// ป้องกันข้อมูลซ้ำของ period และ currency_id
ExchangeRateSchema.index(
  { period: 1, currency_id: 1 },
  { unique: true },
);