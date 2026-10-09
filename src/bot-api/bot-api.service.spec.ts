import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { BotApiService } from './bot-api.service.js';
import { BotApiException } from '../common/exceptions/bot-api.exception.js';
import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';

describe('BotApiService', () => {
  let service: BotApiService;
  let axiosGetSpy: any;

  beforeEach(() => {
    // สร้าง Service โดยส่ง Mock ConfigService เข้าไป
    // เพื่อให้ใช้ค่า Default Token แทนการอ่านจาก Environment
    const mockConfigService = { get: () => undefined };
    service = new BotApiService(
      mockConfigService as unknown as ConfigService,
    );
    axiosGetSpy = jest.spyOn(axios, 'get');
  });

  afterEach(() => {
    axiosGetSpy.mockRestore();
  });

  describe('fetchExchangeRates', () => {

    it('should return exchange rate items on success', async () => {
      axiosGetSpy.mockResolvedValue({
        data: {
          result: { data: { data_detail: [{ period: '2025-Q1' }] } },
        },
      });

      const result = await service.fetchExchangeRates('2024-Q4', '2025-Q1');

      expect(result).toEqual([{ period: '2025-Q1' }]);
    });

    it('should throw BotApiException when BOT API returns 404', async () => {
      axiosGetSpy.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
      });

      await expect(
        service.fetchExchangeRates('2024-Q4', '2025-Q1'),
      ).rejects.toThrow(BotApiException);
    });

    it('should throw BotApiException on network error', async () => {
      axiosGetSpy.mockRejectedValue(new Error('Network Error'));

      await expect(
        service.fetchExchangeRates('2024-Q4', '2025-Q1'),
      ).rejects.toThrow(BotApiException);
    });
  });

  describe('fetchLoanRates', () => {

    it('should return loan rate items on success', async () => {
      axiosGetSpy.mockResolvedValue({
        data: {
          result: { data: { data_detail: [{ period: '2025-01-20' }] } },
        },
      });

      const result = await service.fetchLoanRates('2025-01-01', '2025-01-31');

      expect(result).toEqual([{ period: '2025-01-20' }]);
    });

    it('should throw BotApiException when BOT API returns 401', async () => {
      axiosGetSpy.mockRejectedValue({
        isAxiosError: true,
        response: { status: 401 },
      });

      let caught: unknown;
      try {
        await service.fetchLoanRates('2025-01-01', '2025-01-31');
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(BotApiException);
      expect((caught as BotApiException).getResponse()).toMatchObject({
        success: false,
        error_code: 'BOT_API_UNAUTHORIZED',
      });
    });
  });

  describe('fetchBiborRates', () => {

    it('should return BIBOR items on success', async () => {
      axiosGetSpy.mockResolvedValue({
        data: {
          result: { data: { data_detail: [{ period: '2025-01-01' }] } },
        },
      });

      const result = await service.fetchBiborRates('2025-01-01', '2025-01-31');

      expect(result).toEqual([{ period: '2025-01-01' }]);
    });

    it('should throw BotApiException when data is empty', async () => {
      axiosGetSpy.mockResolvedValue({
        data: { result: { data: { data_detail: [] } } },
      });

      let caught: unknown;
      try {
        await service.fetchBiborRates('2025-01-01', '2025-01-31');
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(BotApiException);
      expect((caught as BotApiException).getResponse()).toMatchObject({
        success: false,
        error_code: 'DATA_NOT_FOUND',
      });
    });
  });

  describe('fetchInterbankRates', () => {

    it('should return interbank items on success', async () => {
      axiosGetSpy.mockResolvedValue({
        data: {
          result: { data: { data_detail: [{ period: '2025-01-01' }] } },
        },
      });

      const result = await service.fetchInterbankRates('2025-01-01', '2025-01-31');

      expect(result).toEqual([{ period: '2025-01-01' }]);
    });

    it('should throw BotApiException when data is empty', async () => {
      axiosGetSpy.mockResolvedValue({
        data: { result: { data: { data_detail: [] } } },
      });

      await expect(
        service.fetchInterbankRates('2025-01-01', '2025-01-31'),
      ).rejects.toThrow(BotApiException);
    });

    it('should throw BotApiException when BOT API returns 502', async () => {
      axiosGetSpy.mockRejectedValue({
        isAxiosError: true,
        response: { status: 502 },
      });

      let caught: unknown;
      try {
        await service.fetchInterbankRates('2025-01-01', '2025-01-31');
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(BotApiException);
      expect((caught as BotApiException).getResponse()).toMatchObject({
        success: false,
        error_code: 'BOT_API_ERROR',
      });
    });
  });

  describe('searchAuthorizedCompany', () => {

    it('should return search results on success', async () => {
      axiosGetSpy.mockResolvedValue({
        data: { ResultSet: [{ Id: '1', AuthorizedName: 'Bank A' }] },
      });

      const result = await service.searchAuthorizedCompany('Bank');

      expect(result).toEqual([{ Id: '1', AuthorizedName: 'Bank A' }]);
    });

    it('should throw BotApiException on network error', async () => {
      axiosGetSpy.mockRejectedValue(new Error('Network Error'));

      await expect(
        service.searchAuthorizedCompany('Bank'),
      ).rejects.toThrow(BotApiException);
    });
  });

  describe('getCompanyLicenseDetails', () => {

    it('should return company detail on success', async () => {
      axiosGetSpy.mockResolvedValue({
        data: {
          AuthorizationInfo: { AuthorizedName: 'Bank A' },
          LicenseInformations: [],
          Branches: [],
        },
      });

      const result = await service.getCompanyLicenseDetails('1');

      expect(result.AuthorizationInfo.AuthorizedName).toBe('Bank A');
    });

    it('should throw BotApiException when BOT API returns 403', async () => {
      axiosGetSpy.mockRejectedValue({
        isAxiosError: true,
        response: { status: 403 },
      });

      let caught: unknown;
      try {
        await service.getCompanyLicenseDetails('1');
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(BotApiException);
      expect((caught as BotApiException).getResponse()).toMatchObject({
        success: false,
        error_code: 'BOT_API_UNAUTHORIZED',
      });
    });
  });

  describe('fetchSeriesList', () => {

    it('should return series list when result is an array', async () => {
      axiosGetSpy.mockResolvedValue({
        data: { result: [{ series_code: 'FM_RT_013' }] },
      });

      const result = await service.fetchSeriesList('FM_RT_013');

      expect(result).toEqual([{ series_code: 'FM_RT_013' }]);
    });

    it('should return series list when result is an object', async () => {
      axiosGetSpy.mockResolvedValue({
        data: {
          result: { data_detail: [{ series_code: 'FM_RT_013' }] },
        },
      });

      const result = await service.fetchSeriesList('FM_RT_013');

      expect(result).toEqual([{ series_code: 'FM_RT_013' }]);
    });

    it('should throw BotApiException when BOT API returns 404', async () => {
      axiosGetSpy.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
      });

      await expect(
        service.fetchSeriesList('NOT_EXIST'),
      ).rejects.toThrow(BotApiException);
    });
  });

  describe('fetchHolidays', () => {

    it('should return holiday list on success', async () => {
      axiosGetSpy.mockResolvedValue({
        data: {
          result: { data: { data_detail: [{ Date: '2025-01-01' }] } },
        },
      });

      const result = await service.fetchHolidays('2025');

      expect(result).toEqual([{ Date: '2025-01-01' }]);
    });

    it('should throw BotApiException on network error', async () => {
      axiosGetSpy.mockRejectedValue(new Error('Network Error'));

      await expect(
        service.fetchHolidays('2025'),
      ).rejects.toThrow(BotApiException);
    });
  });
});