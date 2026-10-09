import { Global, Module } from '@nestjs/common';
import { BotApiService } from './bot-api.service.js';

@Global()
@Module({
  providers: [BotApiService],
  exports: [BotApiService],
})
export class BotApiModule {}