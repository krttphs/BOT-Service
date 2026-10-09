import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// ข้อมูลที่รับเข้ามาจาก Request Body
export class BusinessRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  business_name!: string;
}
