import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BiborController } from './bibor.controller.js';
import { BiborService } from './bibor.service.js';
import { BotApiException } from '../common/exceptions/bot-api.exception.js';

describe('BiborController', () => {

  let controller: BiborController;

  beforeEach(async () => {

    // สร้าง TestingModule จำลองสำหรับการทดสอบ
    const module: TestingModule = await Test.createTestingModule({

      controllers: [BiborController],

      // กำหนด Service ที่ Controller ต้องใช้
      providers: [
        {
          provide: BiborService,

          // Mock Service เพื่อไม่ให้ Test เรียก BOT API จริง
          useValue: {
            analyzeBibor: jest.fn(),
          },
        },
      ],
    }).compile();

    // ดึง Controller ที่ถูกสร้างจาก TestingModule มาใช้งาน
    controller = module.get<BiborController>(BiborController);
  });

  // ทดสอบกรณีที่ Controller เรียก Service สำเร็จ
  it('should return BIBOR analysis data', async () => {

    // จำลองข้อมูลที่ Service จะส่งกลับมา
    const mockResult = {
      request: {
        start_period: '2025-01-01',
        end_period: '2025-06-30',
      },
      summary: {
        trend: 'UP',
        average_rate: 2.4,
        minimum_rate: 2.3,
        maximum_rate: 2.5,
        first_rate: 2.3,
        last_rate: 2.5,
        change: 0.2,
        change_percent: 8.7,
        total_records: 2,
      },
      data: [
        { period: '2025-01-01', overnight: '2.3' },
        { period: '2025-01-02', overnight: '2.5' },
      ],
    };

    // จำลองให้ Service ส่ง mockResult กลับมา
    jest
      .spyOn(controller['biborService'], 'analyzeBibor')
      .mockResolvedValue(mockResult as never);

    // เรียก Controller โดยส่ง start_period และ end_period เข้าไป
    const result = await controller.analyze({
      start_period: '2025-01-01',
      end_period: '2025-06-30',
    });

    // ตรวจสอบว่าผลลัพธ์ที่ Controller ส่งกลับมาตรงกับที่คาดไว้
    expect(result).toEqual(mockResult);
  });

  // ทดสอบกรณีที่ Parameter ที่ส่งเข้ามาไม่ถูกต้อง
  it('should throw BotApiException when parameters are invalid', async () => {

    // จำลองให้ Service โยน BotApiException
    jest
      .spyOn(controller['biborService'], 'analyzeBibor')
      .mockRejectedValue(
        new BotApiException(
          'INVALID_DATE',
          'Invalid date format. Use YYYY-MM-DD.',
          400,
        ),
      );

    // เรียก Controller ด้วยวันที่ที่ไม่ถูกต้อง
    // และตรวจสอบว่ามี BotApiException เกิดขึ้น
    await expect(
      controller.analyze({
        start_period: 'abc',
        end_period: '2025-01-31',
      }),
    ).rejects.toThrow(BotApiException);
  });

  // ทดสอบกรณีที่ไม่พบข้อมูลอัตราดอกเบี้ย BIBOR
  it('should throw NotFoundException when BIBOR rate data is not found', async () => {

    // จำลองให้ Service โยน NotFoundException
    jest
      .spyOn(controller['biborService'], 'analyzeBibor')
      .mockRejectedValue(
        new NotFoundException('BIBOR rate data not found.'),
      );

    // เรียก Controller ด้วยข้อมูลที่ถูกต้อง
    // แต่จำลองให้ Service ไม่พบข้อมูล
    await expect(
      controller.analyze({
        start_period: '2025-01-01',
        end_period: '2025-01-31',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});