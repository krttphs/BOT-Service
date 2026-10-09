import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

describe('DashboardController', () => {

  let controller: DashboardController;

  beforeEach(async () => {

    // สร้าง TestingModule จำลองสำหรับการทดสอบ
    const module: TestingModule = await Test.createTestingModule({

      controllers: [DashboardController],

      // กำหนด Service ที่ Controller ต้องใช้
      providers: [
        {
          provide: DashboardService,

          // Mock Service เพื่อไม่ให้ Test เรียก BOT API จริง
          useValue: {
            getSummary: jest.fn(),
            getIndicators: jest.fn(),
            getIndicatorDetail: jest.fn(),
            getCategories: jest.fn(),
          },
        },
      ],
    }).compile();

    // ดึง Controller ที่ถูกสร้างจาก TestingModule มาใช้งาน
    controller = module.get<DashboardController>(DashboardController);
  });

  // ทดสอบการเรียกข้อมูลสรุป Dashboard
  it('should return dashboard summary', async () => {

    const mockResult = {
      totalIndicators: 40,
      totalCategories: 4,
      recentlyUpdated: 1200,
      lastUpdated: new Date().toISOString(),
    };

    jest
      .spyOn(controller['dashboardService'], 'getSummary')
      .mockResolvedValue(mockResult);

    const result = await controller.getSummary();

    expect(result).toEqual(mockResult);
  });

  // ทดสอบการเรียกข้อมูลรายการตัวชี้วัด
  it('should return indicator list', async () => {

    const mockResult = {
      total: 1,
      page: 1,
      size: 20,
      data: [
        {
          seriesCode: 'FM_RT_013',
          seriesName: 'THOR',
          category: 'อัตราดอกเบี้ยอ้างอิง THOR',
          frequency: 'Quarterly',
          unit: 'ล้านบาท',
        },
      ],
    };

    jest
      .spyOn(controller['dashboardService'], 'getIndicators')
      .mockResolvedValue(mockResult as never);

    const result = await controller.getIndicators({
      keyword: 'THOR',
      page: 1,
      size: 20,
    });

    expect(result).toEqual(mockResult);
  });

  // ทดสอบการเรียกข้อมูลตัวชี้วัดเฉพาะ
  it('should return indicator detail', async () => {

    const mockResult = {
      seriesCode: 'FM_RT_013',
      seriesName: 'THOR',
      category: 'อัตราดอกเบี้ยอ้างอิง THOR',
      frequency: 'Quarterly',
      unit: 'ล้านบาท',
    };

    jest
      .spyOn(controller['dashboardService'], 'getIndicatorDetail')
      .mockResolvedValue(mockResult as never);

    const result = await controller.getIndicatorDetail('FM_RT_013');

    expect(result).toEqual(mockResult);
  });

  // ทดสอบกรณีที่ไม่พบตัวชี้วัด
  it('should throw NotFoundException when indicator is not found', async () => {

    jest
      .spyOn(controller['dashboardService'], 'getIndicatorDetail')
      .mockRejectedValue(
        new NotFoundException('Indicator not found.'),
      );

    await expect(
      controller.getIndicatorDetail('NOT_EXIST'),
    ).rejects.toThrow(NotFoundException);
  });

  // ทดสอบการเรียกข้อมูลหมวดหมู่
  it('should return list of categories', async () => {

    const mockResult = [
      'เงินลงทุนโดยตรงจากต่างประเทศ (Outflow)',
      'อัตราดอกเบี้ยอ้างอิง THOR และอัตราดอกเบี้ย THOR Average',
      'อัตราแลกเปลี่ยนเฉลี่ยของธนาคารพาณิชย์',
      'เครื่องชี้เศรษฐกิจมหภาคของไทย',
    ];

    jest
      .spyOn(controller['dashboardService'], 'getCategories')
      .mockResolvedValue(mockResult);

    const result = await controller.getCategories();

    expect(result).toEqual(mockResult);
  });
});