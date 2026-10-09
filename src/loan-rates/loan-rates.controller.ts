import { Controller, Get, Query} from '@nestjs/common';
import { LoanRatesService } from './loan-rates.service.js';
import { LoanSearchQueryDto } from './dto/loan-search-query.dto.js';

@Controller('search')
export class LoanRatesController {
  constructor(private readonly loanRatesService: LoanRatesService) {}

  @Get()
  search(@Query() query: LoanSearchQueryDto) {
    return this.loanRatesService.searchLoanRates(query);
  }
}