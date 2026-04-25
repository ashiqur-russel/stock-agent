import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { StocksService } from './stocks.service';

describe('StocksService', () => {
  let service: StocksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StocksService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('demo') },
        },
      ],
    }).compile();

    service = module.get<StocksService>(StocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuote', () => {
    it('should return a quote for known symbol', async () => {
      const quote = await service.getQuote('AAPL');
      expect(quote.symbol).toBe('AAPL');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.name).toBe('Apple Inc.');
    });

    it('should throw NotFoundException for unknown symbol', async () => {
      await expect(service.getQuote('XXXXUNKNOWN')).rejects.toThrow(NotFoundException);
    });

    it('should normalize symbol to uppercase', async () => {
      const quote = await service.getQuote('aapl');
      expect(quote.symbol).toBe('AAPL');
    });
  });

  describe('analyzeStock', () => {
    it('should return analysis with signal and indicators', async () => {
      const analysis = await service.analyzeStock({ symbol: 'MSFT', timeframe: 'weekly' });
      expect(analysis.quote.symbol).toBe('MSFT');
      expect(['BUY', 'SELL', 'HOLD']).toContain(analysis.signal.type);
      expect(['STRONG', 'MODERATE', 'WEAK']).toContain(analysis.signal.strength);
      expect(analysis.technicalIndicators.rsi).toBeGreaterThan(0);
      expect(analysis.targetPrice).toBeGreaterThan(0);
      expect(analysis.stopLoss).toBeGreaterThan(0);
    });

    it('should default timeframe to weekly', async () => {
      const analysis = await service.analyzeStock({ symbol: 'GOOGL' });
      expect(analysis.timeframe).toBe('weekly');
    });
  });

  describe('searchStocks', () => {
    it('should find stocks by symbol', async () => {
      const results = await service.searchStocks('AAPL');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol).toBe('AAPL');
    });

    it('should find stocks by name', async () => {
      const results = await service.searchStocks('Apple');
      expect(results.some((r) => r.symbol === 'AAPL')).toBe(true);
    });
  });

  describe('getMarketOverview', () => {
    it('should return multiple stock quotes', async () => {
      const quotes = await service.getMarketOverview();
      expect(quotes.length).toBeGreaterThan(0);
      quotes.forEach((q) => {
        expect(q.symbol).toBeDefined();
        expect(q.price).toBeGreaterThan(0);
      });
    });
  });
});
