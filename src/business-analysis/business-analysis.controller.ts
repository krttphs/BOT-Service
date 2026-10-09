import { Controller, Post, Body } from '@nestjs/common';
import { BusinessAnalysisService } from './business-analysis.service.js';
import { BusinessRequestDto } from './dto/business-request.dto.js';

@Controller('business')
export class BusinessAnalysisController {
  constructor(private readonly businessAnalysisService: BusinessAnalysisService) {}

  @Post('analyze')
  analyze(@Body() body: BusinessRequestDto) {
    return this.businessAnalysisService.analyzeBusiness(body.business_name);
  }
}