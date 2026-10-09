import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from '@jest/globals';
import { BiborService } from './bibor.service.js';

describe('BiborService', () => {
  let service: BiborService;
   
  let mockBotApiService: any;

  beforeEach(() => {
    // สร้าง Service โดยส่ง Mock BotApiService เข้าไป
    // เพราะ BiborService ใช้ BotApiService ในการเรียกข้อมูลจาก BOT API
    mockBotApiService = { fetchBiborRates: jest.fn() };
    service = new BiborService(mockBotApiService);
  });

  // Test การวิเคราะห์อัตราดอกเบี้ย BIBOR
  describe('analyzeBibor', () => {

    // ตรวจสอบกรณีที่ไม่มี start_period หรือ end_period
    it('should throw error when start_period is missing', async () => {
      await expect(
        service.analyzeBibor({
          start_period: '',
          end_period: '2025-06-30',
        }),
      ).rejects.toThrow('start_period and end_period are required.');
    });

    // ตรวจสอบกรณีที่ไม่มี end_period
    it('should throw error when end_period is missing', async () => {
      await expect(
        service.analyzeBibor({
          start_period: '2025-01-01',
          end_period: '',
        }),
      ).rejects.toThrow('start_period and end_period are required.');
    });

    // ตรวจสอบกรณีที่รูปแบบวันที่ไม่ถูกต้อง
    it('should throw error when date format is invalid', async () => {
      await expect(
        service.analyzeBibor({
          start_period: 'abc',
          end_period: '2025-06-30',
        }),
      ).rejects.toThrow('Invalid date format. Use YYYY-MM-DD.');
    });

    // ตรวจสอบกรณีที่ BOT API ส่งข้อมูลว่างกลับมา
    it('should throw error when BOT API returns empty data', async () => {

      mockBotApiService.fetchBiborRates.mockResolvedValue([]);

      await expect(
        service.analyzeBibor({
          start_period: '2025-01-01',
          end_period: '2025-06-30',
        }),
      ).rejects.toThrow('BIBOR rate data not found.');
    });

    // ตรวจสอบกรณีที่ข้อมูลทั้งหมดเป็นค่าที่ไม่สามารถใช้คำนวณได้
    it('should throw error when no valid interest rates found', async () => {

      // จำลองข้อมูลที่อัตราดอกเบี้ยไม่เป็นตัวเลข
      mockBotApiService.fetchBiborRates.mockResolvedValue([
        { period: '2025-01-01', overnight: 'invalid' },
        { period: '2025-01-02', overnight: 'abc' },
      ]);

      await expect(
        service.analyzeBibor({
          start_period: '2025-01-01',
          end_period: '2025-06-30',
        }),
      ).rejects.toThrow('No interest rate data found.');
    });

    // ตรวจสอบกรณีที่อัตราดอกเบี้ยปรับเพิ่มขึ้น
    it('should return UP trend and correct summary when rates rise', async () => {

      // จำลองข้อมูลที่ได้รับจาก BOT API (ยังไม่เรียงลำดับ)
      mockBotApiService.fetchBiborRates.mockResolvedValue([
        { period: '2025-01-02', overnight: '2.5' },
        { period: '2025-01-01', overnight: '2.3' },
      ]);

      const result = await service.analyzeBibor({
        start_period: '2025-01-01',
        end_period: '2025-06-30',
      });

      // ตรวจสอบว่า Service เรียก BOT API ด้วยช่วงเวลาที่ถูกต้อง
      expect(mockBotApiService.fetchBiborRates).toHaveBeenCalledWith(
        '2025-01-01',
        '2025-06-30',
      );

      // ตรวจสอบข้อมูลที่ส่งกลับมา
      expect(result.request).toEqual({
        start_period: '2025-01-01',
        end_period: '2025-06-30',
      });

      // ตรวจสอบข้อมูลสรุป
      expect(result.summary.total_records).toBe(2);
      expect(result.summary.average_rate).toBe(2.4);
      expect(result.summary.minimum_rate).toBe(2.3);
      expect(result.summary.maximum_rate).toBe(2.5);
      expect(result.summary.first_rate).toBe(2.3);
      expect(result.summary.last_rate).toBe(2.5);
      expect(result.summary.change).toBe(0.2);
      expect(result.summary.change_percent).toBeCloseTo(8.7);
      expect(result.summary.trend).toBe('UP');

      // ตรวจสอบว่าข้อมูลถูกเรียงตามวันที่
      expect(result.data).toEqual([
        { period: '2025-01-01', overnight: '2.3' },
        { period: '2025-01-02', overnight: '2.5' },
      ]);
    });

    // ตรวจสอบกรณีที่อัตราดอกเบี้ยปรับลดลง
    it('should return DOWN trend when rates fall', async () => {

      mockBotApiService.fetchBiborRates.mockResolvedValue([
        { period: '2025-01-01', overnight: '2.5' },
        { period: '2025-01-02', overnight: '2.3' },
      ]);

      const result = await service.analyzeBibor({
        start_period: '2025-01-01',
        end_period: '2025-01-31',
      });

      // ตรวจสอบแนวโน้มที่ลดลง
      expect(result.summary.trend).toBe('DOWN');
      expect(result.summary.change).toBeLessThan(0);
    });

    // ตรวจสอบกรณีที่อัตราดอกเบี้ยไม่เปลี่ยนแปลง
    it('should return STABLE trend when rates do not change', async () => {

      mockBotApiService.fetchBiborRates.mockResolvedValue([
        { period: '2025-01-01', overnight: '2.3' },
        { period: '2025-01-02', overnight: '2.3' },
      ]);

      const result = await service.analyzeBibor({
        start_period: '2025-01-01',
        end_period: '2025-01-31',
      });

      // ตรวจสอบแนวโน้มที่คงที่
      expect(result.summary.trend).toBe('STABLE');
      expect(result.summary.change).toBe(0);
    });
  });
});