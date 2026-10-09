import { Injectable, NotFoundException } from '@nestjs/common';
import { BotApiService, BotBiborItem } from '../bot-api/bot-api.service.js';
import { BotApiException } from '../common/exceptions/bot-api.exception.js';
import { AnalyzeBiborDto } from './dto/analyze-bibor.dto.js';

// Service สำหรับจัดการการวิเคราะห์อัตราดอกเบี้ย BIBOR
@Injectable()
export class BiborService {
  constructor(private readonly botApiService: BotApiService) {}

  async analyzeBibor(query: AnalyzeBiborDto) {
    const { start_period, end_period } = query;

    if (!start_period || !end_period) {
      throw new BotApiException('INVALID_PARAMETERS', 'start_period and end_period are required.', 400);
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_period) || !dateRegex.test(end_period)) {
      throw new BotApiException('INVALID_DATE', 'Invalid date format. Use YYYY-MM-DD.', 400);
    }

    const rawData = await this.botApiService.fetchBiborRates(start_period, end_period);

    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new NotFoundException('BIBOR rate data not found.');
    }

    const sortedData = [...rawData].sort(
      (a: BotBiborItem, b: BotBiborItem) =>
        new Date(a.period || a.date || '0').getTime() -
        new Date(b.period || b.date || '0').getTime(),
    );

    const rates = sortedData
      .map((item) => {
        const val = item.overnight ?? item.month_3 ?? item.avg_rate ?? 0;
        return typeof val === 'string' ? parseFloat(val) : val;
      })
      .filter((val): val is number => !Number.isNaN(val) && typeof val === 'number');

    if (rates.length === 0) {
      throw new NotFoundException('No interest rate data found.');
    }

    const sum = rates.reduce((acc, val) => acc + val, 0);
    const average_rate = Number((sum / rates.length).toFixed(4));
    const minimum_rate = Math.min(...rates);
    const maximum_rate = Math.max(...rates);

    const first_rate = rates[0];
    const last_rate = rates[rates.length - 1];
    const change = Number((last_rate - first_rate).toFixed(4));
    const change_percent =
      first_rate !== 0 ? Number(((change / first_rate) * 100).toFixed(2)) : 0;

    let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (change > 0.0001) trend = 'UP';
    else if (change < -0.0001) trend = 'DOWN';

    return {
      request: { start_period, end_period },
      summary: {
        trend,
        average_rate,
        minimum_rate,
        maximum_rate,
        first_rate,
        last_rate,
        change,
        change_percent,
        total_records: sortedData.length,
      },
      data: sortedData,
    };
  }
}
