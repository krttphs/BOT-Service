import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from '@jest/globals';
import { DashboardService } from './dashboard.service.js';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockBotApiService: any;

  // สร้างข้อมูลตัวชี้วัดหนึ่งรายการ
  const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

const makeItem = (
  code: string,
  nameTh: string,
  nameEng: string,
  lastUpdateDate: string = daysAgo(1),
) => ({
  series_code: code,
  series_name_th: nameTh,
  series_name_eng: nameEng,
  last_update_date: lastUpdateDate,
});

  beforeEach(() => {
    // สร้าง Service โดยส่ง Mock BotApiService เข้าไป
    // เพราะ DashboardService ใช้ BotApiService ในการเรียกข้อมูลจาก BOT API
    mockBotApiService = { fetchSeriesList: jest.fn() };
    service = new DashboardService(mockBotApiService);
  });

  // Test การดึงข้อมูลสรุป
  describe('getSummary', () => {

    // ตรวจสอบการนับจำนวนข้อมูลทั้งหมด
    it('should return summary with total records', async () => {

      // จำลองข้อมูลที่แต่ละหมวดหมู่ส่งกลับมา
      mockBotApiService.fetchSeriesList
        .mockResolvedValueOnce([
          makeItem('A', 'A1', 'A1', daysAgo(5)),
          makeItem('B', 'B1', 'B1', daysAgo(5)),
        ])
        .mockResolvedValueOnce([makeItem('C', 'C1', 'C1', daysAgo(90))])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          makeItem('D', 'D1', 'D1', daysAgo(5)),
          makeItem('E', 'E1', 'E1', daysAgo(90)),
          makeItem('F', 'F1', 'F1', daysAgo(90)),
        ]);

      const result = await service.getSummary();

      // ตรวจสอบจำนวนหมวดหมู่ (4 หมวดหมู่)
      expect(result.totalCategories).toBe(4);

      // ตรวจสอบจำนวนตัวชี้วัด = ผลรวมจริง (2 + 1 + 0 + 3 = 6)
      expect(result.totalIndicators).toBe(6);

      // ตรวจสอบจำนวนข้อมูลที่อัปเดตใน 30 วันล่าสุด (2 + 0 + 0 + 1 = 3)
      expect(result.recentlyUpdated).toBe(3);

      // ตรวจสอบวันที่อัปเดตล่าสุด
      expect(result.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    // ตรวจสอบกรณีที่เรียกข้อมูลหมวดหมู่ไม่สำเร็จ
    it('should skip categories that fail to fetch', async () => {

      mockBotApiService.fetchSeriesList
        .mockRejectedValueOnce(new Error('BOT API down'))
        .mockResolvedValueOnce([makeItem('C', 'C1', 'C1', daysAgo(5))])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getSummary();

      // หมวดหมู่ที่ดึงไม่ได้จะถูกข้าม → totalIndicators = 1, recentlyUpdated = 1
      expect(result.totalIndicators).toBe(1);
      expect(result.recentlyUpdated).toBe(1);
    });
  });

  // Test การดึงรายการตัวชี้วัด
  describe('getIndicators', () => {

    // ตรวจสอบว่าดึงข้อมูลทั้งหมดได้
    it('should return all indicators without filter', async () => {

      mockBotApiService.fetchSeriesList.mockResolvedValue([
        makeItem('FM_RT_013', 'THOR', 'THOR'),
      ]);

      const result = await service.getIndicators({});

      // มีทั้งหมด 4 หมวดหมู่ หมวดหมู่ละ 1 รายการ
      expect(result.total).toBe(4);
      expect(result.data).toHaveLength(4);
      expect(result.page).toBe(1);
      expect(result.size).toBe(20);
    });

    // ตรวจสอบการค้นหาด้วย keyword
    it('should filter indicators by keyword', async () => {

      mockBotApiService.fetchSeriesList
        .mockResolvedValueOnce([
          makeItem('FM_RT_013', 'THOR', 'THOR'),
          makeItem('EC_XT_077', 'เงินลงทุน', 'Investment'),
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getIndicators({ keyword: 'THOR' });

      expect(result.total).toBe(1);
      expect(result.data[0].seriesCode).toBe('FM_RT_013');
    });

    // ตรวจสอบการกรองด้วยหมวดหมู่
    it('should filter indicators by category', async () => {

      mockBotApiService.fetchSeriesList
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          makeItem('FM_RT_013', 'THOR', 'THOR'),
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getIndicators({
        category: 'อัตราดอกเบี้ย',
      });

      expect(result.total).toBe(1);
      expect(result.data[0].seriesCode).toBe('FM_RT_013');
    });

    // ตรวจสอบการแบ่งหน้า
    it('should paginate results correctly', async () => {

      mockBotApiService.fetchSeriesList
        .mockResolvedValueOnce([
          makeItem('A', 'A1', 'A1'),
          makeItem('B', 'B1', 'B1'),
        ])
        .mockResolvedValueOnce([makeItem('C', 'C1', 'C1')])
        .mockResolvedValueOnce([makeItem('D', 'D1', 'D1')])
        .mockResolvedValueOnce([makeItem('E', 'E1', 'E1')]);

      const result = await service.getIndicators({
        page: 2,
        size: 2,
      });

      expect(result.total).toBe(5);
      expect(result.page).toBe(2);
      expect(result.size).toBe(2);
      expect(result.data).toHaveLength(2);
    });
  });

  // Test การดึงรายละเอียดตัวชี้วัด
  describe('getIndicatorDetail', () => {

    // ตรวจสอบว่าค้นหาตัวชี้วัดเจอ
    it('should return indicator detail when found', async () => {

      mockBotApiService.fetchSeriesList
        .mockResolvedValueOnce([makeItem('FM_RT_013', 'THOR', 'THOR')])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getIndicatorDetail('FM_RT_013');

      expect(result.seriesCode).toBe('FM_RT_013');
      expect(result.seriesName).toBe('THOR');
      expect(result.frequency).toBe('Quarterly');
      expect(result.source).toBe('Bank of Thailand');
    });

    // ตรวจสอบกรณีที่ไม่พบตัวชี้วัด
    it('should throw NotFoundException when indicator is not found', async () => {

      mockBotApiService.fetchSeriesList.mockResolvedValue([]);

      await expect(
        service.getIndicatorDetail('NOT_EXIST'),
      ).rejects.toThrow('Indicator not found.');
    });
  });

  // Test การดึงหมวดหมู่
  describe('getCategories', () => {

    it('should return list of category names', async () => {

      const result = await service.getCategories();

      expect(result).toHaveLength(4);
      expect(result).toContain('อัตราดอกเบี้ยอ้างอิง THOR และอัตราดอกเบี้ย THOR Average');
    });
  });
});