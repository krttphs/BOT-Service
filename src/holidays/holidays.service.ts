import { Injectable, NotFoundException } from '@nestjs/common';
import { BotApiService } from '../bot-api/bot-api.service.js';

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

// Service สำหรับจัดการข้อมูลวันหยุดธนาคาร
@Injectable()
export class HolidaysService {
  constructor(private readonly botApiService: BotApiService) {}

  async getHolidays(year: string) {
    if (!year) {
      year = new Date().getFullYear().toString();
    }

    const rawList = await this.botApiService.fetchHolidays(year);

    if (!Array.isArray(rawList) || rawList.length === 0) {
      throw new NotFoundException('Holiday data not found.');
    }

    const data = rawList.map((item) => {
      const dateStr = item.Date || item.holiday_date || '';
      const dateObj = new Date(dateStr);
      const dayName = Number.isNaN(dateObj.getTime())
        ? '-'
        : THAI_DAYS[dateObj.getDay()];

      return {
        date: dateStr,
        day: dayName,
        description:
          item.HolidayDescriptionThai ||
          item.HolidayDescription ||
          item.holiday_title_th ||
          '',
        year,
      };
    });

    return {
      success: true,
      year,
      data,
      total: data.length,
    };
  }
}
