import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StocksService } from './stocks.service';
import { AnalyzeStockDto } from './dto/analyze-stock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('stocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get('market')
  @ApiOperation({ summary: 'Get market overview (top stocks)' })
  @ApiResponse({ status: 200, description: 'Market overview data' })
  async getMarketOverview() {
    return this.stocksService.getMarketOverview();
  }

  @Get('quote')
  @ApiOperation({ summary: 'Get real-time stock quote' })
  @ApiQuery({ name: 'symbol', example: 'AAPL' })
  @ApiResponse({ status: 200, description: 'Stock quote data' })
  @ApiResponse({ status: 404, description: 'Symbol not found' })
  async getQuote(@Query('symbol') symbol: string) {
    return this.stocksService.getQuote(symbol);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for stocks by symbol or name' })
  @ApiQuery({ name: 'q', example: 'Apple' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Query('q') query: string) {
    return this.stocksService.searchStocks(query);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Get AI-powered swing trading analysis' })
  @ApiResponse({ status: 200, description: 'Stock analysis with trading signal' })
  @ApiResponse({ status: 404, description: 'Symbol not found' })
  async analyze(@Body() dto: AnalyzeStockDto) {
    return this.stocksService.analyzeStock(dto);
  }
}
