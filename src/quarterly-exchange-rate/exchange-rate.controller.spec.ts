import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateController } from './exchange-rate.controller.js';
import { ExchangeRateService } from './exchange-rate.service.js';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('ExchangeRateController', () => {

  let controller: ExchangeRateController;

  beforeEach(async () => {

    // สร้าง TestingModule จำลองสำหรับการทดสอบ
    const module: TestingModule = await Test.createTestingModule({

      controllers: [ExchangeRateController],

      // กำหนด Service ที่ Controller ต้องใช้
      providers: [
        {
          provide: ExchangeRateService,

          // Mock Service เพื่อไม่ให้ Test เรียก BOT API จริง
          useValue: {
            getQuarterlyExchangeRate: jest.fn(),
          },
        },
      ],
    }).compile();


    // ดึง Controller ที่ถูกสร้างจาก TestingModule มาใช้งาน
    controller = module.get<ExchangeRateController>(
      ExchangeRateController,
    );
  });


  // ทดสอบกรณีที่ Controller เรียก Service สำเร็จ
  it('should return quarterly exchange rate data', async () => {

    // จำลองข้อมูลที่ Service จะส่งกลับมา
    const mockResult = {
      year: 2025,
      quarter: 'Q1',
      averageRate: 33.9542,
      previousQuarter: {
        year: 2024,
        quarter: 'Q4',
        averageRate: 34.2,
      },
      changeFromPreviousQuarter: -0.7187134502923976,
    };


    // จำลองให้ Service ส่ง mockResult กลับมา
    jest
      .spyOn(
        controller['exchangeRateService'],
        'getQuarterlyExchangeRate',
      )
      .mockResolvedValue(mockResult);


    // เรียก Controller โดยส่ง year และ quarter เข้าไป
    const result = await controller.getQuarterlyExchangeRate({
      year: '2025',
      quarter: 'Q1',
    });


    // ตรวจสอบว่าผลลัพธ์ที่ Controller ส่งกลับมาตรงกับที่คาดไว้
    expect(result).toEqual(mockResult);
  });


  // ทดสอบกรณีที่ Query ที่ส่งเข้ามาไม่ถูกต้อง
  it('should throw BadRequestException when query is invalid', async () => {

    // จำลองให้ Service โยน BadRequestException
    jest
      .spyOn(
        controller['exchangeRateService'],
        'getQuarterlyExchangeRate',
      )
      .mockRejectedValue(
        new BadRequestException('Invalid year.'),
      );


    // เรียก Controller ด้วย year ที่ไม่ถูกต้อง
    // และตรวจสอบว่ามี BadRequestException เกิดขึ้น
    await expect(
      controller.getQuarterlyExchangeRate({
        year: 'abc',
        quarter: 'Q1',
      }),
    ).rejects.toThrow(BadRequestException);
  });


  // ทดสอบกรณีที่ไม่พบข้อมูลอัตราแลกเปลี่ยน
  it('should throw NotFoundException when exchange rate data is not found', async () => {

    // จำลองให้ Service โยน NotFoundException
    jest
      .spyOn(
        controller['exchangeRateService'],
        'getQuarterlyExchangeRate',
      )
      .mockRejectedValue(
        new NotFoundException('Exchange rate data not found.'),
      );


    // เรียก Controller ด้วยข้อมูลที่ถูกต้อง
    // แต่จำลองให้ Service ไม่พบข้อมูล
    await expect(
      controller.getQuarterlyExchangeRate({
        year: '2025',
        quarter: 'Q1',
      }),
    ).rejects.toThrow(NotFoundException);
  });


  // ทดสอบกรณีที่ BOT API เกิดข้อผิดพลาด
  it('should throw InternalServerErrorException when BOT API fails', async () => {

    // จำลองให้ Service โยน InternalServerErrorException
    jest
      .spyOn(
        controller['exchangeRateService'],
        'getQuarterlyExchangeRate',
      )
      .mockRejectedValue(
        new InternalServerErrorException(
          'Failed to fetch exchange rate data.',
        ),
      );


    // เรียก Controller ด้วยข้อมูลที่ถูกต้อง
    // และตรวจสอบว่าเกิด InternalServerErrorException
    await expect(
      controller.getQuarterlyExchangeRate({
        year: '2025',
        quarter: 'Q1',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});