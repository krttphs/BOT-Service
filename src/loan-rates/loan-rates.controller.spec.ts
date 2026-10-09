import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { LoanRatesController } from './loan-rates.controller.js';
import { LoanRatesService } from './loan-rates.service.js';

describe('LoanRatesController', () => {

  let controller: LoanRatesController;

  beforeEach(async () => {

    // สร้าง TestingModule จำลองสำหรับการทดสอบ
    const module: TestingModule = await Test.createTestingModule({

      controllers: [LoanRatesController],

      // กำหนด Service ที่ Controller ต้องใช้
      providers: [
        {
          provide: LoanRatesService,

          // Mock Service เพื่อไม่ให้ Test เรียก BOT API จริง
          useValue: {
            searchLoanRates: jest.fn(),
          },
        },
      ],
    }).compile();

    // ดึง Controller ที่ถูกสร้างจาก TestingModule มาใช้งาน
    controller = module.get<LoanRatesController>(LoanRatesController);
  });

  // ทดสอบกรณีที่ Controller เรียก Service สำเร็จ
  it('should return matched loan rates', async () => {

    // จำลองข้อมูลที่ Service จะส่งกลับมา
    const mockResult = {
      success: true,
      purpose: 'mor',
      confidence: 'high',
      amount: 1000000,
      bankType: 'all',
      data: [
        {
          bank_name: 'ธนาคารกรุงไทย',
          type: 'ธนาคารพาณิชย์จดทะเบียนในประเทศ',
          rate: 6.1,
          default_rate: 6.6,
          penaltyGap: '0.50',
          interestCost: 61000,
          period: '2025-01-20',
        },
      ],
    };

    // จำลองให้ Service ส่ง mockResult กลับมา
    jest
      .spyOn(controller['loanRatesService'], 'searchLoanRates')
      .mockResolvedValue(mockResult);

    // เรียก Controller โดยส่ง query เข้าไป
    const result = await controller.search({
      purpose: 'mor',
      confidence: 'high',
      amount: 1000000,
      bankType: 'all',
    });

    // ตรวจสอบว่าผลลัพธ์ที่ Controller ส่งกลับมาตรงกับที่คาดไว้
    expect(result).toEqual(mockResult);
  });

  // ทดสอบกรณีที่ Query ที่ส่งเข้ามาไม่ถูกต้อง
  it('should throw BadRequestException when query is invalid', async () => {

    // จำลองให้ Service โยน BadRequestException
    jest
      .spyOn(controller['loanRatesService'], 'searchLoanRates')
      .mockRejectedValue(
        new BadRequestException(
          'purpose must be one of: mor, mlr, mrr',
        ),
      );

    // เรียก Controller ด้วย purpose ที่ไม่ถูกต้อง
    await expect(
      controller.search({
        purpose: 'invalid',
        confidence: 'high',
        amount: 1000000,
        bankType: 'all',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // ทดสอบกรณีที่ไม่พบข้อมูลอัตราดอกเบี้ยเงินกู้
  it('should throw InternalServerErrorException when loan rate data is not found', async () => {

    // จำลองให้ Service โยน InternalServerErrorException
    jest
      .spyOn(controller['loanRatesService'], 'searchLoanRates')
      .mockRejectedValue(
        new InternalServerErrorException('Loan rate data not found.'),
      );

    // เรียก Controller ด้วยข้อมูลที่ถูกต้อง
    await expect(
      controller.search({
        purpose: 'mor',
        confidence: 'high',
        amount: 1000000,
        bankType: 'all',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});