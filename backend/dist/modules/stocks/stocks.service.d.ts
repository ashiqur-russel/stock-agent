import { ConfigService } from '@nestjs/config';
import { AnalyzeStockDto } from './dto/analyze-stock.dto';
export interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap: number;
    high52w: number;
    low52w: number;
    timestamp: string;
}
export interface SwingSignal {
    type: 'BUY' | 'SELL' | 'HOLD';
    strength: 'STRONG' | 'MODERATE' | 'WEAK';
    confidence: number;
    reasoning: string[];
}
export interface StockAnalysis {
    quote: StockQuote;
    signal: SwingSignal;
    technicalIndicators: {
        rsi: number;
        macdSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        movingAverage50: number;
        movingAverage200: number;
        volumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    };
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    targetPrice: number;
    stopLoss: number;
    timeframe: string;
}
export declare class StocksService {
    private readonly config;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    private readonly mockQuotes;
    constructor(config: ConfigService);
    getQuote(symbol: string): Promise<StockQuote>;
    analyzeStock(dto: AnalyzeStockDto): Promise<StockAnalysis>;
    searchStocks(query: string): Promise<Array<{
        symbol: string;
        name: string;
    }>>;
    getMarketOverview(): Promise<StockQuote[]>;
    private getMockQuote;
    private calculateTechnicalIndicators;
    private generateSwingSignal;
    private calculateTargets;
    private assessRisk;
}
