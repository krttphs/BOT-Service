import { IsNotEmpty, IsString, Matches } from 'class-validator';

// ข้อมูลที่รับเข้ามาจาก Query Parameter
export class AnalyzeBiborDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'start_period ต้องอยู่ในรูปแบบ YYYY-MM-DD',
  })
  start_period!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'end_period ต้องอยู่ในรูปแบบ YYYY-MM-DD',
  })
  end_period!: string;
}
