import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BusinessAnalysisController } from './business-analysis.controller.js';
import { BusinessAnalysisService } from './business-analysis.service.js';

describe('BusinessAnalysisController', () => {

  let controller: BusinessAnalysisController;

  beforeEach(async () => {

    // สร้าง TestingModule จำลองสำหรับการทดสอบ
    const module: TestingModule = await Test.createTestingModule({

      controllers: [BusinessAnalysisController],

      // กำหนด Service ที่ Controller ต้องใช้
      providers: [
        {
          provide: BusinessAnalysisService,

          // Mock Service เพื่อไม่ให้ Test เรียก BOT API จริง
          useValue: {
            analyzeBusiness: jest.fn(),
          },
        },
      ],
    }).compile();

    // ดึง Controller ที่ถูกสร้างจาก TestingModule มาใช้งาน
    controller = module.get<BusinessAnalysisController>(
      BusinessAnalysisController,
    );
  });

  // ทดสอบกรณีที่ Controller เรียก Service สำเร็จ
  it('should return business analysis data', async () => {

    // จำลองข้อมูลที่ Service จะส่งกลับมา
    const mockResult = {
      success: true,
      data: {
        company: {
          id: '123',
          name: 'ธนาคารสยาม จำกัด (มหาชน)',
          type: 'Commercial Bank',
          address: 'Bangkok',
        },
        licenseSummary: {
          total: 3,
          active: 2,
          inactive: 1,
          licenses: [],
        },
        serviceCapabilities: {
          deposit: true,
          loan: true,
          hpls: false,
        },
        stability: {
          score: 70,
          level: 'HIGH',
        },
      },
    };

    // จำลองให้ Service ส่ง mockResult กลับมา
    jest
      .spyOn(controller['businessAnalysisService'], 'analyzeBusiness')
      .mockResolvedValue(mockResult as never);

    // เรียก Controller โดยส่ง business_name เข้าไป
    const result = await controller.analyze({
      business_name: 'สยาม',
    });

    // ตรวจสอบว่าผลลัพธ์ที่ Controller ส่งกลับมาตรงกับที่คาดไว้
    expect(result).toEqual(mockResult);
  });

  // ทดสอบกรณีที่ไม่พบข้อมูลบริษัท
  it('should throw NotFoundException when company is not found', async () => {

    // จำลองให้ Service โยน NotFoundException
    jest
      .spyOn(controller['businessAnalysisService'], 'analyzeBusiness')
      .mockRejectedValue(
        new NotFoundException('Company not found.'),
      );

    // เรียก Controller ด้วยชื่อบริษัทที่ไม่พบ
    // และตรวจสอบว่ามี NotFoundException เกิดขึ้น
    await expect(
      controller.analyze({
        business_name: 'บริษัทที่ไม่มีอยู่จริง',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});