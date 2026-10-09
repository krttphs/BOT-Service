import { Injectable, NotFoundException } from '@nestjs/common';
import { BotApiService } from '../bot-api/bot-api.service.js';
import {
  IndicatorDetail,
  IndicatorListResponse,
  DashboardSummary,
} from './interfaces/dashboard.interface.js';

const CATEGORY_NAME_MAP: Record<string, string> = {
  EC_XT_077: 'เงินลงทุนโดยตรงจากต่างประเทศ (Outflow)',
  FM_RT_013: 'อัตราดอกเบี้ยอ้างอิง THOR และอัตราดอกเบี้ย THOR Average',
  FM_FX_001_S3: 'อัตราแลกเปลี่ยนเฉลี่ยของธนาคารพาณิชย์',
  EC_EI_027: 'เครื่องชี้เศรษฐกิจมหภาคของไทย',
};

const TARGET_CATEGORIES = [
  'EC_XT_077',
  'FM_RT_013',
  'FM_FX_001_S3',
  'EC_EI_027',
];

// Service สำหรับจัดการ Dashboard
@Injectable()
export class DashboardService {
  constructor(private readonly botApiService: BotApiService) {}

  private mapIndicator(
    item: Record<string, unknown>,
    categoryCode: string,
  ): IndicatorDetail {
    return {
      seriesCode: (item.series_code as string) || '',
      seriesName: (item.series_name_th as string) || 'ตัวชี้วัดจาก BOT',
      category: CATEGORY_NAME_MAP[categoryCode] || categoryCode,
      frequency: 'Quarterly',
      unit: 'ล้านบาท',
      description: (item.series_name_eng as string) || 'ข้อมูลดึงตรงจาก BOT Public API',
      source: 'Bank of Thailand',
      lastUpdated: (item.last_update_date as string) || new Date().toISOString(),
      botUrl: 'https://www.bot.or.th',
    };
  }

  async getSummary(): Promise<DashboardSummary> {
    const categories = await this.getCategories();
    let totalIndicators = 0;
    let recentlyUpdated = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const category of TARGET_CATEGORIES) {
      try {
        const items = await this.botApiService.fetchSeriesList(category);
        totalIndicators += items.length;
        for (const item of items) {
          const dateStr = (item.last_update_date as string) || '';
          if (!dateStr) continue;
          const d = new Date(dateStr);
          if (!isNaN(d.getTime()) && d >= thirtyDaysAgo) {
            recentlyUpdated++;
          }
        }
      } catch {
        // skip
      }
    }

    return {
      totalIndicators,
      totalCategories: categories.length,
      recentlyUpdated,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getIndicators(query: {
    keyword?: string;
    category?: string;
    frequency?: string;
    page?: number;
    size?: number;
  }): Promise<IndicatorListResponse> {
    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const allIndicators: IndicatorDetail[] = [];

    for (const category of TARGET_CATEGORIES) {
      try {
        const fetchedList = await this.botApiService.fetchSeriesList(category);
        for (const item of fetchedList) {
          allIndicators.push(this.mapIndicator(item, category));
        }
      } catch {
        // ข้าม category ที่ดึงไม่ได้
      }
    }

    let filtered = allIndicators;
    if (query.category) {
      filtered = filtered.filter((i) => i.category.includes(query.category!));
    }
    if (query.frequency) {
      filtered = filtered.filter((i) => i.frequency === query.frequency);
    }
    if (query.keyword) {
      const kw = query.keyword.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.seriesCode.toLowerCase().includes(kw) ||
          i.seriesName.toLowerCase().includes(kw) ||
          (i.description && i.description.toLowerCase().includes(kw)),
      );
    }

    const total = filtered.length;
    const start = (page - 1) * size;
    const data = filtered.slice(start, start + size);

    return { total, page, size, data };
  }

  async getIndicatorDetail(seriesCode: string): Promise<IndicatorDetail> {
    for (const category of TARGET_CATEGORIES) {
      try {
        const fetchedList = await this.botApiService.fetchSeriesList(category);
        const found = fetchedList.find(
          (item) => item.series_code === seriesCode,
        );
        if (found) {
          return this.mapIndicator(found, category);
        }
      } catch {
        // ข้าม category ที่ดึงไม่ได้
      }
    }

    throw new NotFoundException('Indicator not found.');
  }

  getCategories(): Promise<string[]> {
    return Promise.resolve(
      TARGET_CATEGORIES.map((code) => CATEGORY_NAME_MAP[code] || code),
    );
  }
}
