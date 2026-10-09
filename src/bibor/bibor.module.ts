import { Module } from '@nestjs/common';
import { BiborController } from './bibor.controller.js';
import { BiborService } from './bibor.service.js';

// Module สำหรับจัดการ Feature BIBOR
@Module({
    controllers: [BiborController],
    providers: [BiborService]
})
export class BiborModule {}
