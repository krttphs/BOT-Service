export type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface DashboardSummary {
  totalIndicators: number;
  totalCategories: number;
  recentlyUpdated: number;
  lastUpdated: string;
}

export interface Indicator {
  seriesCode: string;
  seriesName: string;
  category: string;
  frequency: Frequency;
  unit: string;
  description?: string;
  source?: string;
  lastUpdated?: string;
  botUrl?: string;
}

export type IndicatorDetail = Indicator;

export interface IndicatorListResponse {
  total: number;
  page: number;
  size: number;
  data: Indicator[];
}

// โครงสร้าง Response จาก BOT Search Series API
export interface BotSearchSeriesResponse {
  result: {
    data: {
      data_detail: {
        series_code: string;
        series_name_th: string;
        series_name_eng: string;
        last_update_date: string;
      }[];
    };
  };
}
