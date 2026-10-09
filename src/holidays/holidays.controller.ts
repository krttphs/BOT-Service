import { Controller, Get, Query} from '@nestjs/common';
import { HolidayQueryDto } from './dto/holiday-query.dto.js';
import { HolidaysService } from './holidays.service.js';

@Controller('financial-institutions-holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  getHolidays(@Query() query: HolidayQueryDto) {
    return this.holidaysService.getHolidays(query.year ?? '2024');
  }
}