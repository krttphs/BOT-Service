import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from '@jest/globals';
import { HolidaysService } from './holidays.service.js';

describe('HolidaysService', () => {
  let service: HolidaysService;
   
  let mockBotApiService: any;

  beforeEach(() => {
    // สร้าง Service โดยส่ง Mock BotApiService เข้าไป
    // เพราะ HolidaysService ใช้ BotApiService ในการเรียกข้อมูลจาก BOT API
    mockBotApiService = { fetchHolidays: jest.fn() };
    service = new HolidaysService(mockBotApiService);
  });

  // Test การดึงข้อมูลวันหยุดธนาคาร
  describe('getHolidays', () => {

    // ตรวจสอบการแปลงข้อมูลจาก BOT API
    it('should map holiday data correctly', async () => {

      // จำลองข้อมูลที่ได้รับจาก BOT API
      mockBotApiService.fetchHolidays.mockResolvedValue([
        {
          Date: '2025-01-01T12:00:00',
          HolidayDescriptionThai: 'วันขึ้นปีใหม่',
        },
        {
          Date: '2025-04-14T12:00:00',
          HolidayDescription: 'Songkran Festival',
        },
      ]);

      const result = await service.getHolidays('2025');

      // ตรวจสอบว่า Service เรียก BOT API ด้วยปีที่ถูกต้อง
      expect(mockBotApiService.fetchHolidays).toHaveBeenCalledWith('2025');

      // ตรวจสอบข้อมูลที่ส่งกลับมา
      expect(result.success).toBe(true);
      expect(result.year).toBe('2025');
      expect(result.total).toBe(2);

      // ตรวจสอบรายการแรก (1 มกราคม 2568 เป็นวันพุธ)
      expect(result.data[0]).toEqual({
        date: '2025-01-01T12:00:00',
        day: 'พุธ',
        description: 'วันขึ้นปีใหม่',
        year: '2025',
      });

      // ตรวจสอบรายการที่สอง (14 เมษายน 2568 เป็นวันจันทร์)
      expect(result.data[1].day).toBe('จันทร์');
      expect(result.data[1].description).toBe('Songkran Festival');
    });

    // ตรวจสอบกรณีที่ไม่มีข้อมูลวันหยุด
    it('should throw NotFoundException when holiday data is empty', async () => {

      // จำลอง BotApiService ให้ส่งข้อมูลว่างกลับมา
      mockBotApiService.fetchHolidays.mockResolvedValue([]);

      await expect(
        service.getHolidays('2025'),
      ).rejects.toThrow('Holiday data not found.');
    });

    // ตรวจสอบกรณีที่ไม่มีการระบุปี
    it('should use current year when year is not provided', async () => {

      mockBotApiService.fetchHolidays.mockResolvedValue([
        { Date: '2025-01-01T12:00:00' },
      ]);

      await service.getHolidays(undefined as unknown as string);

      // ตรวจสอบว่า Service เรียก BOT API ด้วยปีปัจจุบัน
      expect(mockBotApiService.fetchHolidays).toHaveBeenCalledWith(
        String(new Date().getFullYear()),
      );
    });

    // ตรวจสอบกรณีที่วันที่ไม่ถูกต้อง
    it('should use dash when date is invalid', async () => {

      mockBotApiService.fetchHolidays.mockResolvedValue([
        { Date: 'invalid-date' },
      ]);

      const result = await service.getHolidays('2025');

      // วันที่ไม่ถูกต้องจะแสดงเป็น -
      expect(result.data[0].day).toBe('-');
      expect(result.data[0].description).toBe('');
    });
  });
});