import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { InterbankRatesController } from './interbank-rates.controller.js';
import { InterbankRatesService } from './interbank-rates.service.js';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

describe('InterbankRatesController', () => {
  let controller: InterbankRatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterbankRatesController],
      providers: [
        {
          provide: InterbankRatesService,
          useValue: {
            analyze: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InterbankRatesController>(InterbankRatesController);
  });

  it('should return interbank rate analysis data', async () => {
    const mockResult = {
      success: true,
      average_interest_rate: 1.95,
      highest_interest_rate: 2.02,
      lowest_interest_rate: 1.90,
      spread: 0.12,
      trend: 'STABLE',
      volatility: 'Low',
      rate_change: 0.01,
      total_records: 22,
      effective_end_period: '2025-01-31',
      data_source: 'Bank of Thailand',
      insufficient_date: false,
    };

    jest
      .spyOn(controller['interbankRatesService'], 'analyze')
      .mockResolvedValue(mockResult as any);

    const result = await controller.analyze({
      start_period: '2025-01-01',
      end_period: '2025-01-31',
      term_type: 'O/N',
    });

    expect(result).toEqual(mockResult);
  });

  it('should throw BadRequestException when query is invalid', async () => {
    jest
      .spyOn(controller['interbankRatesService'], 'analyze')
      .mockRejectedValue(new BadRequestException('Invalid date format.'));

    await expect(
      controller.analyze({
        start_period: 'abc',
        end_period: '2025-01-31',
        term_type: 'O/N',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException when interbank rate data is not found', async () => {
    jest
      .spyOn(controller['interbankRatesService'], 'analyze')
      .mockRejectedValue(
        new NotFoundException('Interbank rate data not found.'),
      );

    await expect(
      controller.analyze({
        start_period: '2025-01-01',
        end_period: '2025-01-31',
        term_type: 'O/N',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
