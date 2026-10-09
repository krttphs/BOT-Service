import { IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';

// ข้อมูลที่รับเข้ามาจาก Query Parameter
export class ExchangeRateQueryDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: 'year ต้องเป็นปี ค.ศ. 4 หลัก' })
  year!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Q1', 'Q2', 'Q3', 'Q4'], { message: 'quarter ต้องเป็น Q1-Q4' })
  quarter!: string;
}
