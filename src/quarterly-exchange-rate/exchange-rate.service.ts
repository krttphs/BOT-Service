import { Injectable,
    BadRequestException,
    NotFoundException,

} from '@nestjs/common';

import { BotApiService, BotExchangeRateItem } from '../bot-api/bot-api.service.js';

import { ExchangeRateQueryDto } from './dto/exchange-rate-query.dto.js';

// Service สำหรับจัดการการคำนวณอัตราแลกเปลี่ยนรายไตรมาส
@Injectable()
export class ExchangeRateService {
  constructor(private readonly botApiService: BotApiService) {}

    // ตรวจสอบข้อมูลที่ผู้ใช้ส่งเข้ามา
  validateQuery(query: ExchangeRateQueryDto) {
    const { year, quarter } = query;

    // ตรวจสอบว่ามี year และ quarter หรือไม่
    if (!year || !quarter) {
      throw new BadRequestException('Year and Quarter are required.');
    }

    // แปลง year จาก string เป็น number
    const yearNumber = Number(year);

    // ตรวจสอบว่า year เป็นจำนวนเต็มและไม่น้อยกว่า 2002
    if (!Number.isInteger(yearNumber) || yearNumber < 2002) {
      throw new BadRequestException('Invalid year.');
    }


    // ตรวจสอบว่า quarter เป็น Q1-Q4
    if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
      throw new BadRequestException('Invalid quarter.');
    }

    // คืนค่าปีที่แปลงแล้วและ quarter
    return {
      yearNumber,
      quarter,
    };
  }

    // หาไตรมาสก่อนหน้าจากไตรมาสที่ผู้ใช้เลือก
  getPreviousQuarter(yearNumber: number, quarter: string) {
    let previousYear = yearNumber;
    let previousQuarter = '';

    switch (quarter) {
      case 'Q1':
        // Q1 ต้องย้อนกลับไป Q4 ของปีก่อน
        previousYear = yearNumber - 1;
        previousQuarter = 'Q4';
        break;

      case 'Q2':
        previousQuarter = 'Q1';
        break;

      case 'Q3':
        previousQuarter = 'Q2';
        break;

      case 'Q4':
        previousQuarter = 'Q3';
        break;
    }

    return {
      previousYear,
      previousQuarter,
    };
  }

    // ค้นหาข้อมูลของไตรมาสปัจจุบันและไตรมาสก่อนหน้า
  findQuarterlyData(
    data: BotExchangeRateItem[],
    currentPeriod: string,
    previousPeriod: string,
  ) {
    // ค้นหาข้อมูลของไตรมาสปัจจุบัน
    const currentData = data.find(
      (item) => item.period === currentPeriod,
    );

    // ค้นหาข้อมูลของไตรมาสก่อนหน้า
    const previousData = data.find(
      (item) => item.period === previousPeriod,
    );

    // ถ้าไม่พบข้อมูลของไตรมาสใดไตรมาสหนึ่ง
    if (!currentData || !previousData) {
      throw new NotFoundException('Exchange rate data not found.');
    }

    return {
      currentData,
      previousData,
    };
  }

    // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลงจากไตรมาสก่อนหน้า
  calculateChange(currentData: BotExchangeRateItem, previousData: BotExchangeRateItem) {
    // แปลง mid_rate จาก string เป็น number
    const currentRate = Number(currentData.mid_rate);
    const previousRate = Number(previousData.mid_rate);

    const changeFromPreviousQuarter =
      ((currentRate - previousRate) / previousRate) * 100;

    return {
      currentRate,
      previousRate,
      changeFromPreviousQuarter,
    };
  }

    // ประมวลผลข้อมูลอัตราแลกเปลี่ยนรายไตรมาสทั้งหมด
  async getQuarterlyExchangeRate(query: ExchangeRateQueryDto) {
    // ตรวจสอบข้อมูลที่รับเข้ามา
    const { yearNumber, quarter } = this.validateQuery(query);

    // หาไตรมาสก่อนหน้า
    const { previousYear, previousQuarter } =
      this.getPreviousQuarter(yearNumber, quarter);

    // สร้างชื่อช่วงเวลาของทั้งสองไตรมาส
    const currentPeriod = `${yearNumber}-${quarter}`;
    const previousPeriod = `${previousYear}-${previousQuarter}`;

    // เรียกข้อมูลจาก BOT API (ผ่าน BotApiService)
    const data = await this.botApiService.fetchExchangeRates(
      previousPeriod,
      currentPeriod,
    );

    // ค้นหาข้อมูลของทั้งสองไตรมาส
    const { currentData, previousData } =
      this.findQuarterlyData(
        data,
        currentPeriod,
        previousPeriod,
      );

    // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
    const {
      currentRate,
      previousRate,
      changeFromPreviousQuarter,
    } = this.calculateChange(currentData, previousData);

    // ส่งผลลัพธ์กลับไปให้ Controller
    return {
      year: yearNumber,
      quarter,
      averageRate: currentRate,
      previousQuarter: {
        year: previousYear,
        quarter: previousQuarter,
        averageRate: previousRate,
      },
      changeFromPreviousQuarter,
    };
  }
}