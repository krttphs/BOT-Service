import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// ชนิดข้อมูลเอกสารผลการค้นหาบริษัท
export type CompanySearchResultDocument =
  HydratedDocument<CompanySearchResult>;

// Schema สำหรับ Collection company_search
@Schema({
  collection: 'company_search',
  timestamps: true,
})
export class CompanySearchResult {
  @Prop({ required: true })
  keyword: string;

  @Prop({ required: true })
  Id: string;

  @Prop()
  AuthorizedName: string;
}

export const CompanySearchResultSchema =
  SchemaFactory.createForClass(CompanySearchResult);

// ป้องกันข้อมูลซ้ำของ keyword และ Id
CompanySearchResultSchema.index(
  { keyword: 1, Id: 1 },
  { unique: true },
);

// ชนิดข้อมูลเอกสารรายละเอียดใบอนุญาต
export type CompanyLicenseDetailDocument =
  HydratedDocument<CompanyLicenseDetail>;

// Schema สำหรับ Collection company_license_details
@Schema({
  collection: 'company_license_details',
  timestamps: true,
})
export class CompanyLicenseDetail {
  @Prop({ required: true })
  id: string;

  @Prop({ type: Object })
  AuthorizationInfo: Record<string, string>;

  @Prop({ type: [Object] })
  LicenseInformations: Record<string, string>[];

  @Prop({ type: Object })
  Branches: unknown;
}

export const CompanyLicenseDetailSchema =
  SchemaFactory.createForClass(CompanyLicenseDetail);

CompanyLicenseDetailSchema.index({ id: 1 }, { unique: true });