import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsPositive, Max } from 'class-validator';

// ข้อมูลที่รับเข้ามาจาก Query Parameter
export class LoanSearchQueryDto {
  @IsIn(['mor', 'mlr', 'mrr'], { message: 'purpose ต้องเป็น mor, mlr หรือ mrr' })
  purpose!: string;

  @IsIn(['low', 'high'], { message: 'confidence ต้องเป็น low หรือ high' })
  confidence!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'amount ต้องเป็นตัวเลข' })
  @IsPositive({ message: 'amount ต้องมากกว่า 0' })
  @Max(1_000_000_000_000, { message: 'amount เกินช่วงที่อนุญาต' })
  amount!: number;

  @IsIn(['all', 'thai', 'foreign'], {
    message: 'bankType ต้องเป็น all, thai หรือ foreign',
  })
  bankType!: string;
}
