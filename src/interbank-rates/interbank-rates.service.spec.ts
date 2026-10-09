import { InterbankRatesService } from './interbank-rates.service.js';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('InterbankRatesService', () => {
  let service: InterbankRatesService;
   
  let mockBotApiService: any;

  beforeEach(() => {
    mockBotApiService = { fetchInterbankRates: jest.fn() };
    service = new InterbankRatesService(mockBotApiService);
  });

  describe('validateQuery', () => {
    it('should validate correct query', () => {
      const result = service.validateQuery({
        start_period: '2025-01-01',
        end_period: '2025-01-31',
        term_type: 'O/N',
      });

      expect(result).toEqual({
        start_period: '2025-01-01',
        end_period: '2025-01-31',
        term_type: 'O/N',
      });
    });

    it('should throw error when start_period is missing', () => {
      expect(() =>
        service.validateQuery({
          start_period: '',
          end_period: '2025-01-31',
          term_type: 'O/N',
        }),
      ).toThrow('start_period, end_period and term_type are required.');
    });

    it('should throw error when end_period is missing', () => {
      expect(() =>
        service.validateQuery({
          start_period: '2025-01-01',
          end_period: '',
          term_type: 'O/N',
        }),
      ).toThrow('start_period, end_period and term_type are required.');
    });

    it('should throw error when term_type is missing', () => {
      expect(() =>
        service.validateQuery({
          start_period: '2025-01-01',
          end_period: '2025-01-31',
          term_type: '',
        }),
      ).toThrow('start_period, end_period and term_type are required.');
    });

    it('should throw error when date format is invalid', () => {
      expect(() =>
        service.validateQuery({
          start_period: 'abc',
          end_period: '2025-01-31',
          term_type: 'O/N',
        }),
      ).toThrow('Invalid date format.');
    });

    it('should throw error when term_type is invalid', () => {
      expect(() =>
        service.validateQuery({
          start_period: '2025-01-01',
          end_period: '2025-01-31',
          term_type: 'Invalid',
        }),
      ).toThrow('Invalid term_type.');
    });

    it('should throw error when start_period is after end_period', () => {
      expect(() =>
        service.validateQuery({
          start_period: '2025-02-01',
          end_period: '2025-01-01',
          term_type: 'O/N',
        }),
      ).toThrow('start_period must not be after end_period.');
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate statistics correctly', () => {
      const records = [
        {
          weighted_average_interest_rate: 1.94,
          max_interest_rate: 2.02,
          min_interest_rate: 1.90,
        },
        {
          weighted_average_interest_rate: 1.95,
          max_interest_rate: 2.00,
          min_interest_rate: 1.90,
        },
        {
          weighted_average_interest_rate: 1.96,
          max_interest_rate: 2.01,
          min_interest_rate: 1.91,
        },
      ];

      const result = service.calculateStatistics(records);

      expect(result.average_interest_rate).toBe(1.95);
      expect(result.highest_interest_rate).toBe(2.02);
      expect(result.lowest_interest_rate).toBe(1.9);
      expect(result.spread).toBeCloseTo(0.12);
    });
  });

  describe('filterByTermType', () => {
    it('should filter data by O/N term type', () => {
      const mockData = [
        {
          period: '2025-01-01',
          term_type_name_th: 'O/N',
          term_type_name_eng: 'O/N',
          min_interest_rate: '1.90000',
          max_interest_rate: '2.02000',
          mode_interest_rate: '1.90000',
          weighted_average_interest_rate: '1.94169',
        },
        {
          period: '2025-01-01',
          term_type_name_th: '1 Week',
          term_type_name_eng: '1 Week',
          min_interest_rate: '1.80000',
          max_interest_rate: '1.90000',
          mode_interest_rate: '1.85000',
          weighted_average_interest_rate: '1.85000',
        },
      ];

      const result = service.filterByTermType(mockData, 'O/N');

      expect(result).toHaveLength(1);
      expect(result[0].term_type_name_eng).toBe('O/N');
    });
  });

  describe('formatData', () => {
    it('should format BOT data correctly', () => {
      const filteredData = [
        {
          period: '2025-01-01',
          term_type_name_th: 'O/N',
          term_type_name_eng: 'O/N',
          min_interest_rate: '1.90000',
          max_interest_rate: '2.02000',
          mode_interest_rate: '1.90000',
          weighted_average_interest_rate: '1.94169',
        },
      ];

      const result = service.formatData(filteredData);

      expect(result).toHaveLength(1);
      expect(result[0].weighted_average_interest_rate).toBe(1.94169);
      expect(result[0].max_interest_rate).toBe(2.02);
      expect(result[0].min_interest_rate).toBe(1.9);
    });

    it('should skip records with NaN avg rate', () => {
      const filteredData = [
        {
          period: '2025-01-01',
          term_type_name_th: 'O/N',
          term_type_name_eng: 'O/N',
          min_interest_rate: '1.90000',
          max_interest_rate: '2.02000',
          mode_interest_rate: '1.90000',
          weighted_average_interest_rate: 'invalid',
        },
      ];

      const result = service.formatData(filteredData);

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateTrend', () => {
    it('should return Rising when rates trend upward', () => {
      const records = [
        { weighted_average_interest_rate: 1.90, max_interest_rate: 2.0, min_interest_rate: 1.8 },
        { weighted_average_interest_rate: 1.95, max_interest_rate: 2.0, min_interest_rate: 1.8 },
        { weighted_average_interest_rate: 2.00, max_interest_rate: 2.1, min_interest_rate: 1.9 },
        { weighted_average_interest_rate: 2.05, max_interest_rate: 2.1, min_interest_rate: 1.9 },
      ];
      expect(service.calculateTrend(records)).toBe('Rising');
    });

    it('should return Falling when rates trend downward', () => {
      const records = [
        { weighted_average_interest_rate: 2.05, max_interest_rate: 2.1, min_interest_rate: 1.9 },
        { weighted_average_interest_rate: 2.00, max_interest_rate: 2.1, min_interest_rate: 1.9 },
        { weighted_average_interest_rate: 1.95, max_interest_rate: 2.0, min_interest_rate: 1.8 },
        { weighted_average_interest_rate: 1.90, max_interest_rate: 2.0, min_interest_rate: 1.8 },
      ];
      expect(service.calculateTrend(records)).toBe('Falling');
    });

    it('should return null when fewer than 2 records', () => {
      expect(service.calculateTrend([{ weighted_average_interest_rate: 1.9, max_interest_rate: 2.0, min_interest_rate: 1.8 }])).toBeNull();
    });
  });

  describe('analyze', () => {
    it('should return interbank rate analysis data', async () => {
      mockBotApiService.fetchInterbankRates = () => Promise.resolve([
        {
          period: '2025-01-01',
          term_type_name_th: 'O/N',
          term_type_name_eng: 'O/N',
          min_interest_rate: '1.90000',
          max_interest_rate: '2.02000',
          weighted_average_interest_rate: '1.94169',
        },
        {
          period: '2025-01-02',
          term_type_name_th: 'O/N',
          term_type_name_eng: 'O/N',
          min_interest_rate: '1.90000',
          max_interest_rate: '2.00000',
          weighted_average_interest_rate: '1.94973',
        },
      ]);

      const result = await service.analyze({
        start_period: '2025-01-01',
        end_period: '2025-01-31',
        term_type: 'O/N',
      });

      expect(result.success).toBe(true);
      expect(result.total_records).toBe(2);
      expect(result.average_interest_rate).toBeDefined();
      expect(result.highest_interest_rate).toBeDefined();
      expect(result.lowest_interest_rate).toBeDefined();
      expect(result.spread).toBeDefined();
      expect(result.trend).toBeDefined();
      expect(result.volatility).toBeDefined();
      expect(result.data_source).toBe('Bank of Thailand');
    });

    it('should throw error when no data matches term_type', async () => {
      mockBotApiService.fetchInterbankRates = () => Promise.resolve([]);

      await expect(
        service.analyze({
          start_period: '2025-01-01',
          end_period: '2025-01-31',
          term_type: 'O/N',
        }),
      ).rejects.toThrow('Interbank rate data not found.');
    });
  });
});
