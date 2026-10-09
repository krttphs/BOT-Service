import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { ExchangeRateService } from './exchange-rate.service.js';

import { ExchangeRateQueryDto } from './dto/exchange-rate-query.dto.js';


@Controller('exchange-rates')
export class ExchangeRateController {

  constructor(
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  @Get('quarterly-change')
  async getQuarterlyExchangeRate(
    @Query() query: ExchangeRateQueryDto,
  ) {

    return this.exchangeRateService.getQuarterlyExchangeRate(query);
  }
}