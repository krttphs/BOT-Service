import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from '@jest/globals';
import { LoanRatesService } from './loan-rates.service.js';

describe('LoanRatesService', () => {
  let service: LoanRatesService;
   
  let mockBotApiService: any;

  beforeEach(() => {
    // สร้าง Service โดยส่ง Mock BotApiService เข้าไป
    // เพราะ LoanRatesService ใช้ BotApiService ในการเรียกข้อมูลจาก BOT API
    mockBotApiService = { fetchLoanRates: jest.fn() };
    service = new LoanRatesService(mockBotApiService);
  });

  // Test การตรวจสอบข้อมูลที่ผู้ใช้ส่งเข้ามา
  describe('validateQuery', () => {

    it('should validate correct query', () => {
      const result = service.validateQuery({
        purpose: 'mor',
        confidence: 'high',
        amount: 1000000,
        bankType: 'all',
      });

      expect(result).toEqual({
        purpose: 'mor',
        confidence: 'high',
        amount: 1000000,
        bankType: 'all',
      });
    });

    it('should throw error when purpose is invalid', () => {
      expect(() =>
        service.validateQuery({
          purpose: 'invalid',
          confidence: 'high',
          amount: 1000000,
          bankType: 'all',
        }),
      ).toThrow('purpose must be one of: mor, mlr, mrr');
    });

    it('should throw error when confidence is invalid', () => {
      expect(() =>
        service.validateQuery({
          purpose: 'mor',
          confidence: 'invalid',
          amount: 1000000,
          bankType: 'all',
        }),
      ).toThrow('confidence must be one of: low, high');
    });

    it('should throw error when amount is not positive', () => {
      expect(() =>
        service.validateQuery({
          purpose: 'mor',
          confidence: 'high',
          amount: 0,
          bankType: 'all',
        }),
      ).toThrow('amount must be greater than 0.');
    });

    it('should throw error when bankType is invalid', () => {
      expect(() =>
        service.validateQuery({
          purpose: 'mor',
          confidence: 'high',
          amount: 1000000,
          bankType: 'invalid',
        }),
      ).toThrow('bankType must be one of: all, thai, foreign');
    });
  });

  // Test การค้นหาอัตราดอกเบี้ยเงินกู้
  describe('searchLoanRates', () => {

    // เตรียมข้อมูลจำลองจาก BOT API
    const banksData = [
      {
        period: '2025-01-15',
        bank_name_th: 'Bank A',
        bank_name_eng: 'A',
        bank_type_name_th: 'Thai',
        bank_type_name_eng: 'Commercial banks registered in Thailand',
        mor: '6.50',
        mlr: '6.10',
        mrr: '6.20',
        default_rate: '7.00',
      },
      {
        period: '2025-01-20',
        bank_name_th: 'Bank A',
        bank_name_eng: 'A',
        bank_type_name_th: 'Thai',
        bank_type_name_eng: 'Commercial banks registered in Thailand',
        mor: '6.40',
        mlr: '6.05',
        mrr: '6.15',
        default_rate: '7.00',
      },
      {
        period: '2025-01-20',
        bank_name_th: 'Bank B',
        bank_name_eng: 'B',
        bank_type_name_th: 'Foreign',
        bank_type_name_eng: 'Foreign banks',
        mor: '6.10',
        default_rate: '6.60',
      },
      {
        period: '2025-01-20',
        bank_name_th: 'Bank C',
        bank_name_eng: 'C',
        bank_type_name_th: 'Thai',
        bank_type_name_eng: 'Commercial banks registered in Thailand',
        mor: '',
        default_rate: '7.00',
      },
    ];

    // ตรวจสอบกรณีที่ BOT API ไม่มีข้อมูล
    it('should throw InternalServerErrorException when loan rate data is empty', async () => {

      // จำลอง BotApiService ให้ส่งข้อมูลว่างกลับมา
      mockBotApiService.fetchLoanRates.mockResolvedValue([]);

      await expect(
        service.searchLoanRates({
          purpose: 'mor',
          confidence: 'high',
          amount: 1000000,
          bankType: 'all',
        }),
      ).rejects.toThrow('Loan rate data not found.');
    });

    // ตรวจสอบการค้นหาแบบ confidence สูง (เรียงตามอัตราดอกเบี้ย)
    it('should sort by rate when confidence is high', async () => {

      mockBotApiService.fetchLoanRates.mockResolvedValue(banksData);

      const result = await service.searchLoanRates({
        purpose: 'mor',
        confidence: 'high',
        amount: 100000,
        bankType: 'all',
      });

      // ตรวจสอบข้อมูลที่ส่งกลับมา
      expect(result.success).toBe(true);
      expect(result.purpose).toBe('mor');
      expect(result.confidence).toBe('high');
      expect(result.data).toHaveLength(2);

      // อันดับแรกคือ Bank B (อัตรา 6.1) และอันดับสองคือ Bank A (อัตรา 6.4)
      expect(result.data[0].bank_name).toBe('Bank B');
      expect(result.data[0].rate).toBe(6.1);
      expect(result.data[0].default_rate).toBe(6.6);
      expect(result.data[0].penaltyGap).toBe('0.50');
      expect(result.data[0].interestCost).toBe(6100);

      expect(result.data[1].bank_name).toBe('Bank A');
      expect(result.data[1].rate).toBe(6.4);
      expect(result.data[1].penaltyGap).toBe('0.60');
      expect(result.data[1].interestCost).toBe(6400);
    });

    // ตรวจสอบการค้นหาแบบ confidence ต่ำ (เรียงตามส่วนต่าง)
    it('should sort by penalty gap when confidence is low', async () => {

      mockBotApiService.fetchLoanRates.mockResolvedValue(banksData);

      const result = await service.searchLoanRates({
        purpose: 'mor',
        confidence: 'low',
        amount: 100000,
        bankType: 'all',
      });

      // Bank B มีส่วนต่างน้อยกว่า จึงขึ้นก่อน
      expect(result.data[0].bank_name).toBe('Bank B');
      expect(result.data[0].penaltyGap).toBe('0.50');
      expect(result.data[1].bank_name).toBe('Bank A');
      expect(result.data[1].penaltyGap).toBe('0.60');
    });

    // ตรวจสอบการกรองประเภทธนาคาร
    it('should filter banks by bankType', async () => {

      mockBotApiService.fetchLoanRates.mockResolvedValue(banksData);

      const result = await service.searchLoanRates({
        purpose: 'mor',
        confidence: 'high',
        amount: 100000,
        bankType: 'thai',
      });

      // เฉพาะธนาคารไทยเท่านั้นที่ถูกเลือก
      expect(result.data).toHaveLength(1);
      expect(result.data[0].bank_name).toBe('Bank A');
      expect(result.data[0].type).toBe('Thai');
    });

    // ตรวจสอบกรณีที่เรียก Service ด้วยพารามิเตอร์ที่ไม่ถูกต้อง
    it('should throw error when query is invalid', async () => {

      await expect(
        service.searchLoanRates({
          purpose: 'invalid',
          confidence: 'high',
          amount: 100000,
          bankType: 'all',
        }),
      ).rejects.toThrow('purpose must be one of: mor, mlr, mrr');
    });
  });
});