import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

// ข้อมูลที่รับเข้ามาจาก Query Parameter
export class AnalyzeInterbankDto {
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

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  term_type!: string;
}
