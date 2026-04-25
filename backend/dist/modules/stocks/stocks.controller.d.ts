import { StocksService } from './stocks.service';
import { AnalyzeStockDto } from './dto/analyze-stock.dto';
export declare class StocksController {
    private readonly stocksService;
    constructor(stocksService: StocksService);
    getMarketOverview(): Promise<import("./stocks.service").StockQuote[]>;
    getQuote(symbol: string): Promise<import("./stocks.service").StockQuote>;
    search(query: string): Promise<{
        symbol: string;
        name: string;
    }[]>;
    analyze(dto: AnalyzeStockDto): Promise<import("./stocks.service").StockAnalysis>;
}
