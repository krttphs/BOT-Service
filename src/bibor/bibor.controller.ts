import { Controller, Post, Body} from '@nestjs/common';
import { BiborService } from './bibor.service.js';
import { AnalyzeBiborDto } from './dto/analyze-bibor.dto.js';

@Controller('bibor')
export class BiborController {
  constructor(private readonly biborService: BiborService) {}

  @Post('analyze')
  async analyze(@Body() body: AnalyzeBiborDto) {
    return this.biborService.analyzeBibor(body);
  }
}
