import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// ชนิดข้อมูลเอกสาร Financial Institution Holiday
export type HolidayDocument = HydratedDocument<Holiday>;

// Schema สำหรับ Collection financial_institution_holidays
@Schema({
  collection: 'financial_institution_holidays',
  timestamps: true,
})
export class Holiday {
  // ปี พ.ศ. เช่น 2025
  @Prop({ required: true })
  year: string;

  // ตัวอย่าง: 2025-01-01T12:00:00
  @Prop()
  Date: string;

  @Prop()
  HolidayDescriptionThai: string;

  @Prop()
  HolidayDescription: string;

  @Prop()
  holiday_date: string;

  @Prop()
  holiday_title_th: string;
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday);

HolidaySchema.index({ year: 1, Date: 1 });