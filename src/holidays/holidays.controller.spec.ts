import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HolidaysController } from './holidays.controller.js';
import { HolidaysService } from './holidays.service.js';

describe('HolidaysController', () => {

  let controller: HolidaysController;

  beforeEach(async () => {

    // สร้าง TestingModule จำลองสำหรับการทดสอบ
    const module: TestingModule = await Test.createTestingModule({

      controllers: [HolidaysController],

      // กำหนด Service ที่ Controller ต้องใช้
      providers: [
        {
          provide: HolidaysService,

          // Mock Service เพื่อไม่ให้ Test เรียก BOT API จริง
          useValue: {
            getHolidays: jest.fn(),
          },
        },
      ],
    }).compile();

    // ดึง Controller ที่ถูกสร้างจาก TestingModule มาใช้งาน
    controller = module.get<HolidaysController>(HolidaysController);
  });

  // ทดสอบกรณีที่ Controller เรียก Service สำเร็จ
  it('should return holiday data', async () => {

    // จำลองข้อมูลที่ Service จะส่งกลับมา
    const mockResult = {
      success: true,
      year: '2025',
      data: [
        {
          date: '2025-01-01',
          day: 'พุธ',
          description: 'วันขึ้นปีใหม่',
          year: '2025',
        },
      ],
      total: 1,
    };

    // จำลองให้ Service ส่ง mockResult กลับมา
    jest
      .spyOn(controller['holidaysService'], 'getHolidays')
      .mockResolvedValue(mockResult);

    // เรียก Controller โดยส่ง year เข้าไป
    const result = await controller.getHolidays({ year: '2025' });

    // ตรวจสอบว่าผลลัพธ์ที่ Controller ส่งกลับมาตรงกับที่คาดไว้
    expect(result).toEqual(mockResult);
  });

  // ทดสอบกรณีที่ไม่มีการส่ง year
  it('should use default year when year is not provided', async () => {

    jest
      .spyOn(controller['holidaysService'], 'getHolidays')
      .mockResolvedValue({
        success: true,
        year: '2024',
        data: [],
        total: 0,
      });

    await controller.getHolidays({});

    // ตรวจสอบว่า Service ถูกเรียกด้วยปีเริ่มต้นคือ 2024
    expect(controller['holidaysService'].getHolidays).toHaveBeenCalledWith(
      '2024',
    );
  });

  // ทดสอบกรณีที่ไม่พบข้อมูลวันหยุด
  it('should throw NotFoundException when holiday data is not found', async () => {

    // จำลองให้ Service โยน NotFoundException
    jest
      .spyOn(controller['holidaysService'], 'getHolidays')
      .mockRejectedValue(
        new NotFoundException('Holiday data not found.'),
      );

    // เรียก Controller ด้วยปีที่ถูกต้อง
    // แต่จำลองให้ Service ไม่พบข้อมูล
    await expect(
      controller.getHolidays({ year: '1990' }),
    ).rejects.toThrow(NotFoundException);
  });
});