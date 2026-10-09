import { Controller, Get, Param, Query} from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { IndicatorQueryDto } from './dto/indicator-query.dto.js';

// Controller สำหรับรับ Request ของ Dashboard
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('indicators')
  getIndicators(@Query() query: IndicatorQueryDto) {
    return this.dashboardService.getIndicators(query);
  }

  @Get('indicators/:seriesCode')
  getIndicatorDetail(@Param('seriesCode') seriesCode: string) {
    return this.dashboardService.getIndicatorDetail(seriesCode);
  }

  @Get('categories')
  getCategories() {
    return this.dashboardService.getCategories();
  }
}
