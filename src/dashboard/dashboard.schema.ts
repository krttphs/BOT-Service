import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// ชนิดข้อมูลเอกสาร Series List Cache
export type SeriesListCacheDocument =
  HydratedDocument<SeriesListCache>;

// Schema สำหรับ Collection series_list_cache
@Schema({
  collection: 'series_list_cache',
  timestamps: true,
})
export class SeriesListCache {
  // ตัวอย่าง: EC_XT_077
  @Prop({ required: true })
  category: string;

  // รายการตัวชี้วัดที่ดึงมาจาก BOT API
  @Prop({ type: [Object] })
  items: Record<string, unknown>[];
}

export const SeriesListCacheSchema =
  SchemaFactory.createForClass(SeriesListCache);

SeriesListCacheSchema.index({ category: 1 }, { unique: true });