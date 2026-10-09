import { Controller, Post, Body} from '@nestjs/common';
import { InterbankRatesService } from './interbank-rates.service.js';
import { AnalyzeInterbankDto } from './dto/analyze-interbank.dto.js';

@Controller('interbank-rates')
export class InterbankRatesController {
  constructor(
    private readonly interbankRatesService: InterbankRatesService,
  ) {}

  @Post('analysis')
  async analyze(@Body() body: AnalyzeInterbankDto) {
    return this.interbankRatesService.analyze(body);
  }
}
