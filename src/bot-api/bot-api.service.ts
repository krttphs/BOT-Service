import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { BotApiException } from '../common/exceptions/bot-api.exception.js';

export interface BotExchangeRateItem {
  period: string;
  currency_id: string;
  currency_name_th: string;
  currency_name_eng: string;
  buying_sight: string;
  buying_transfer: string;
  selling: string;
  mid_rate: string;
}

export interface BotLoanRateItem {
  period: string;
  bank_type_name_th: string;
  bank_type_name_eng: string;
  bank_name_th: string;
  bank_name_eng: string;
  mor: string;
  mlr: string;
  mrr: string;
  default_rate: string;
  [key: string]: string;
}

export interface BotBiborItem {
  period?: string;
  date?: string;
  overnight?: string | number;
  month_1?: string | number;
  month_3?: string | number;
  month_6?: string | number;
  month_12?: string | number;
  avg_rate?: string | number;
  [key: string]: unknown;
}

export interface BotInterbankItem {
  period: string;
  term_type_name_th?: string;
  term_type_name_eng?: string;
  term_type_th?: string;
  term_type_eng?: string;
  min_interest_rate?: string;
  min_rate?: string;
  max_interest_rate?: string;
  max_rate?: string;
  mode_interest_rate?: string;
  weighted_average_interest_rate?: string;
  weighted_avg_interbank_rate?: string;
  avg_rate?: string;
}

export interface BotSearchResultItem {
  Id: string;
  AuthorizedName: string;
}

export interface BotCompanyDetail {
  AuthorizationInfo: Record<string, string>;
  LicenseInformations: Record<string, string>[];
  Branches: unknown;
}

interface BotDataDetailResponse<T> {
  result?: {
    data?: {
      data_detail?: T[];
    };
  };
}

interface BotNestedDataResponse<T> {
  result?: {
    data?: {
      data_detail?: T[];
    } | T[];
  };
}

interface BotResultSetResponse<T> {
  ResultSet?: T[];
}

interface BotSeriesListResponse {
  result?: unknown;
}

interface BotApiTokens {
  seriesList: string;
  bibor: string;
  loan: string;
  holidays: string;
  interbank: string;
  exchange: string;
  license: string;
}

@Injectable()
export class BotApiService {
  private readonly logger = new Logger(BotApiService.name);
  private readonly baseUrl: string;
  private readonly tokens: BotApiTokens;

  constructor(private readonly configService: ConfigService) {
    // อ่านจาก env แบบ flat (BOT_API_BASE_URL) เพื่อให้ override ได้จริง
    // เช่น ชี้ไป mock server ตอน load test
    this.baseUrl =
      this.configService.get<string>('BOT_API_BASE_URL') ??
      'https://gateway.api.bot.or.th';

    // อ่าน Token จากไฟล์ .env
    this.tokens = {
      seriesList: this.configService.get<string>('BOT_API_TOKEN_SeriesList') ?? '',
      bibor: this.configService.get<string>('BOT_API_TOKEN_Bibor') ?? '',
      loan: this.configService.get<string>('BOT_API_TOKEN_Loan') ?? '',
      holidays: this.configService.get<string>('BOT_API_TOKEN_Holidays') ?? '',
      interbank: this.configService.get<string>('BOT_API_TOKEN_Interbank') ?? '',
      exchange: this.configService.get<string>('BOT_API_TOKEN_ExchangRate') ?? '',
      license: this.configService.get<string>('BOT_API_TOKEN_License') ?? '',
    };
  }

  // Header สำหรับ API ที่ใช้ Token ตรงๆ (เช่น Exchange Rate, Loan Rate, License)
  private tokenHeaders(token: string): Record<string, string> {
    return {
      Accept: 'application/json',
      Authorization: token,
    };
  }

  // Header สำหรับ API ที่ใช้ Bearer Token (เช่น Bibor, Interbank, Holidays, SeriesList)
  private bearerHeaders(token: string): Record<string, string> {
    return {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private mapBotStatusError(status: number): {
    code: string;
    message: string;
  } {
    if (status === 401 || status === 403) {
      return {
        code: 'BOT_API_UNAUTHORIZED',
        message: 'BOT API Token ไม่ถูกต้องหรือหมดอายุ',
      };
    }

    if (status === 404) {
      return {
        code: 'DATA_NOT_FOUND',
        message: 'ไม่พบข้อมูลจากธนาคารแห่งประเทศไทยในช่วงวันที่ที่ระบุ',
      };
    }

    return {
      code: 'BOT_API_ERROR',
      message: 'ไม่สามารถเชื่อมต่อ BOT API ได้',
    };
  }

  // ดึงข้อมูลอัตราแลกเปลี่ยนรายไตรมาส
  async fetchExchangeRates(
    startPeriod: string,
    endPeriod: string,
  ): Promise<BotExchangeRateItem[]> {
    try {
      const response = await axios.get<
        BotDataDetailResponse<BotExchangeRateItem>
      >(
        `${this.baseUrl}/Stat-ExchangeRate/v2/QUARTERLY_AVG_EXG_RATE/`,
        {
          params: {
            end_period: endPeriod,
            start_period: startPeriod,
            currency: 'USD',
          },
          headers: this.tokenHeaders(this.tokens.exchange),
          timeout: 10000,
        },
      );

      return response.data?.result?.data?.data_detail ?? [];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status) {
        const mapped = this.mapBotStatusError(error.response.status);
        throw new BotApiException(
          mapped.code,
          mapped.message,
          error.response.status,
        );
      }

      throw new BotApiException(
        'BOT_API_ERROR',
        'ไม่สามารถเชื่อมต่อ BOT API ได้',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ดึงข้อมูลอัตราดอกเบี้ยเงินกู้
  async fetchLoanRates(
    startPeriod: string,
    endPeriod: string,
  ): Promise<BotLoanRateItem[]> {
    try {
      const response = await axios.get<BotDataDetailResponse<BotLoanRateItem>>(
        `${this.baseUrl}/LoanRate/v2/loan_rate/`,
        {
          params: {
            end_period: endPeriod,
            start_period: startPeriod,
          },
          headers: this.tokenHeaders(this.tokens.loan),
          timeout: 10000,
        },
      );

      return response.data?.result?.data?.data_detail ?? [];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status) {
        const mapped = this.mapBotStatusError(error.response.status);
        throw new BotApiException(
          mapped.code,
          mapped.message,
          error.response.status,
        );
      }
      throw new BotApiException(
        'BOT_API_ERROR',
        'ไม่สามารถเชื่อมต่อ BOT API ได้',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ดึงข้อมูล BIBOR
  async fetchBiborRates(
    startPeriod: string,
    endPeriod: string,
  ): Promise<BotBiborItem[]> {
    try {
      const response = await axios.get<BotNestedDataResponse<BotBiborItem>>(
        `${this.baseUrl}/BIBOR/v2/bibor_avg_rate/`,
        {
          params: {
            start_period: startPeriod,
            end_period: endPeriod,
          },
          headers: this.bearerHeaders(this.tokens.bibor),
          timeout: 10000,
        },
      );

      const nestedData = response.data?.result?.data;
      let rawData: BotBiborItem[] = [];

      if (Array.isArray(nestedData)) {
        rawData = nestedData;
      } else if (nestedData && Array.isArray(nestedData.data_detail)) {
        rawData = nestedData.data_detail;
      }

      if (rawData.length === 0) {
        throw new BotApiException(
          'DATA_NOT_FOUND',
          'ไม่พบข้อมูลอัตราดอกเบี้ย BIBOR ในช่วงวันที่ที่ระบุ',
          HttpStatus.NOT_FOUND,
        );
      }

      return rawData;
    } catch (error) {
      if (error instanceof BotApiException) {
        throw error;
      }
      if (axios.isAxiosError(error) && error.response?.status) {
        const mapped = this.mapBotStatusError(error.response.status);
        throw new BotApiException(
          mapped.code,
          mapped.message,
          error.response.status,
        );
      }
      throw new BotApiException(
        'BOT_API_ERROR',
        'ไม่สามารถเชื่อมต่อ BOT API ได้',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ดึงข้อมูล Interbank
  async fetchInterbankRates(
    startPeriod: string,
    endPeriod: string,
  ): Promise<BotInterbankItem[]> {
    try {
      const response = await axios.get<
        BotDataDetailResponse<BotInterbankItem>
      >(
        `${this.baseUrl}/Stat-InterbankTransactionRate/v2/INTRBNK_TXN_RATE`,
        {
          params: {
            start_period: startPeriod,
            end_period: endPeriod,
          },
          headers: this.bearerHeaders(this.tokens.interbank),
          timeout: 10000,
        },
      );

      const resultData = response.data?.result?.data?.data_detail;

      if (!Array.isArray(resultData) || resultData.length === 0) {
        throw new BotApiException(
          'DATA_NOT_FOUND',
          'ไม่พบข้อมูลอัตราดอกเบี้ยสำหรับช่วงเวลาที่ระบุ',
          HttpStatus.NOT_FOUND,
        );
      }

      return resultData;
    } catch (error) {
      if (error instanceof BotApiException) {
        throw error;
      }
      if (axios.isAxiosError(error) && error.response?.status) {
        const mapped = this.mapBotStatusError(error.response.status);
        throw new BotApiException(
          mapped.code,
          mapped.message,
          error.response.status,
        );
      }
      throw new BotApiException(
        'UPSTREAM_DATA_INVALID',
        'ไม่สามารถเชื่อมต่อกับ BOT API ได้ หรือข้อมูลที่ส่งกลับมาไม่ถูกต้อง',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ค้นหาบริษัทที่ได้รับอนุญาต
  async searchAuthorizedCompany(
    keyword: string,
  ): Promise<BotSearchResultItem[]> {
    try {
      const response = await axios.get<
        BotResultSetResponse<BotSearchResultItem>
      >(
        `${this.baseUrl}/BotLicenseCheckAPI/SearchAuthorized`,
        {
          params: {
            keyword,
            limit: 1,
          },
          headers: this.tokenHeaders(this.tokens.license),
          timeout: 10000,
        },
      );

      return response.data?.ResultSet ?? [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // log เฉพาะ status code ฝั่ง server ไม่ dump response/ข้อมูล upstream
        this.logger.warn(
          `searchAuthorizedCompany failed: status=${error.response?.status ?? 'network'}`,
        );
      }
      if (axios.isAxiosError(error) && error.response?.status) {
        const mapped = this.mapBotStatusError(error.response.status);
        throw new BotApiException(
          mapped.code,
          mapped.message,
          error.response.status,
        );
      }
      throw new BotApiException(
        'BOT_API_ERROR',
        'ไม่สามารถเชื่อมต่อ BOT API ได้',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ดึงรายละเอียดใบอนุญาตของบริษัท
  async getCompanyLicenseDetails(
    id: string,
  ): Promise<BotCompanyDetail> {
    try {
      const response = await axios.get<BotCompanyDetail>(
        `${this.baseUrl}/BotLicenseCheckAPI/AuthorizedDetail`,
        {
          params: {
            id,
          },
          headers: this.tokenHeaders(this.tokens.license),
          timeout: 10000,
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status) {
        const mapped = this.mapBotStatusError(error.response.status);
        throw new BotApiException(
          mapped.code,
          mapped.message,
          error.response.status,
        );
      }
      throw new BotApiException(
        'BOT_API_ERROR',
        'ไม่สามารถเชื่อมต่อ BOT API ได้',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ดึงรายการ Series
  async fetchSeriesList(
    category: string,
  ): Promise<Record<string, unknown>[]> {
    try {
      const response = await axios.get<BotSeriesListResponse>(
        `${this.baseUrl}/categorylist/series_list/`,
        {
          params: {
            category,
          },
          headers: this.bearerHeaders(this.tokens.seriesList),
          timeout: 10000,
        },
      );

      const resultObj = response.data?.result;
      let rawData: unknown[] = [];

      if (Array.isArray(resultObj)) {
        rawData = resultObj;
      } else if (resultObj && typeof resultObj === 'object') {
        const possibleArray = Object.values(
          resultObj as Record<string, unknown>,
        ).find((value) => Array.isArray(value));

        if (Array.isArray(possibleArray)) {
          rawData = possibleArray;
        }
      }

      return rawData as Record<string, unknown>[];
    } catch (error) {
      if (error instanceof BotApiException) {
        throw error;
      }
      if (axios.isAxiosError(error) && error.response?.status) {
        const mapped = this.mapBotStatusError(error.response.status);
        throw new BotApiException(
          mapped.code,
          mapped.message,
          error.response.status,
        );
      }
      throw new BotApiException(
        'BOT_API_ERROR',
        'ไม่สามารถเชื่อมต่อ BOT API ได้',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ดึงข้อมูลวันหยุดสถาบันการเงิน
  async fetchHolidays(
    year: string,
  ): Promise<Record<string, string>[]> {
    try {
      const response = await axios.get<
        BotNestedDataResponse<Record<string, string>>
      >(
        `${this.baseUrl}/financial-institutions-holidays/`,
        {
          params: {
            year,
          },
          headers: this.bearerHeaders(this.tokens.holidays),
          timeout: 10000,
        },
      );

      const nestedData = response.data?.result?.data;
      let rawList: Record<string, string>[] = [];

      if (Array.isArray(nestedData)) {
        rawList = nestedData;
      } else if (nestedData && Array.isArray(nestedData.data_detail)) {
        rawList = nestedData.data_detail;
      }

      return rawList;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status) {
        const mapped = this.mapBotStatusError(error.response.status);
        throw new BotApiException(
          mapped.code,
          mapped.message,
          error.response.status,
        );
      }
      throw new BotApiException(
        'BOT_API_ERROR',
        'ไม่สามารถเชื่อมต่อ BOT API ได้',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}