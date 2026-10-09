import { IsOptional, IsString, Matches } from 'class-validator';

// ข้อมูลที่รับเข้ามาจาก Query Parameter
export class HolidayQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'year ต้องเป็นปี 4 หลัก' })
  year?: string;
}
