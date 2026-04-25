"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StocksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StocksService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let StocksService = StocksService_1 = class StocksService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(StocksService_1.name);
        this.baseUrl = 'https://www.alphavantage.co/query';
        this.mockQuotes = {
            AAPL: {
                name: 'Apple Inc.',
                price: 189.5,
                change: 2.3,
                changePercent: 1.23,
                volume: 55000000,
                marketCap: 2950000000000,
                high52w: 198.23,
                low52w: 164.08,
            },
            GOOGL: {
                name: 'Alphabet Inc.',
                price: 165.2,
                change: -1.1,
                changePercent: -0.66,
                volume: 22000000,
                marketCap: 2050000000000,
                high52w: 193.31,
                low52w: 129.4,
            },
            MSFT: {
                name: 'Microsoft Corp.',
                price: 415.3,
                change: 4.5,
                changePercent: 1.09,
                volume: 18000000,
                marketCap: 3090000000000,
                high52w: 430.82,
                low52w: 309.45,
            },
            TSLA: {
                name: 'Tesla Inc.',
                price: 245.6,
                change: -8.2,
                changePercent: -3.23,
                volume: 90000000,
                marketCap: 782000000000,
                high52w: 278.98,
                low52w: 138.8,
            },
            NVDA: {
                name: 'NVIDIA Corp.',
                price: 875.4,
                change: 22.3,
                changePercent: 2.62,
                volume: 42000000,
                marketCap: 2160000000000,
                high52w: 974.0,
                low52w: 402.23,
            },
            AMZN: {
                name: 'Amazon.com Inc.',
                price: 185.7,
                change: 1.8,
                changePercent: 0.98,
                volume: 35000000,
                marketCap: 1940000000000,
                high52w: 201.2,
                low52w: 118.35,
            },
            META: {
                name: 'Meta Platforms Inc.',
                price: 510.8,
                change: 6.4,
                changePercent: 1.27,
                volume: 16000000,
                marketCap: 1300000000000,
                high52w: 531.49,
                low52w: 274.38,
            },
            NFLX: {
                name: 'Netflix Inc.',
                price: 628.5,
                change: 9.2,
                changePercent: 1.49,
                volume: 5000000,
                marketCap: 270000000000,
                high52w: 691.69,
                low52w: 344.73,
            },
        };
        this.apiKey = this.config.get('ALPHA_VANTAGE_API_KEY', 'demo');
    }
    async getQuote(symbol) {
        const upperSymbol = symbol.toUpperCase();
        this.logger.log(`Fetching quote for ${upperSymbol}`);
        if (this.apiKey === 'demo' || this.mockQuotes[upperSymbol]) {
            return this.getMockQuote(upperSymbol);
        }
        try {
            const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${upperSymbol}&apikey=${this.apiKey}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }
            const data = await response.json();
            const globalQuote = data['Global Quote'];
            if (!globalQuote || !globalQuote['05. price']) {
                throw new common_1.NotFoundException(`Stock symbol '${upperSymbol}' not found`);
            }
            return {
                symbol: upperSymbol,
                name: upperSymbol,
                price: parseFloat(globalQuote['05. price']),
                change: parseFloat(globalQuote['09. change']),
                changePercent: parseFloat(globalQuote['10. change percent'].replace('%', '')),
                volume: parseInt(globalQuote['06. volume']),
                marketCap: 0,
                high52w: parseFloat(globalQuote['03. high']),
                low52w: parseFloat(globalQuote['04. low']),
                timestamp: globalQuote['07. latest trading day'],
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.warn(`API error for ${upperSymbol}, falling back to mock data: ${error.message}`);
            return this.getMockQuote(upperSymbol);
        }
    }
    async analyzeStock(dto) {
        const timeframe = dto.timeframe || 'weekly';
        const quote = await this.getQuote(dto.symbol);
        const indicators = this.calculateTechnicalIndicators(quote);
        const signal = this.generateSwingSignal(quote, indicators);
        const { targetPrice, stopLoss } = this.calculateTargets(quote, signal);
        return {
            quote,
            signal,
            technicalIndicators: indicators,
            riskLevel: this.assessRisk(indicators, signal),
            targetPrice,
            stopLoss,
            timeframe,
        };
    }
    async searchStocks(query) {
        const upperQuery = query.toUpperCase();
        const results = Object.entries(this.mockQuotes)
            .filter(([symbol, data]) => symbol.includes(upperQuery) || data.name?.toUpperCase().includes(upperQuery))
            .map(([symbol, data]) => ({ symbol, name: data.name || symbol }));
        if (results.length > 0 || this.apiKey === 'demo') {
            return results;
        }
        try {
            const url = `${this.baseUrl}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            const matches = data.bestMatches || [];
            return matches.slice(0, 10).map((m) => ({
                symbol: m['1. symbol'],
                name: m['2. name'],
            }));
        }
        catch {
            return results;
        }
    }
    async getMarketOverview() {
        const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META', 'NFLX'];
        return Promise.all(symbols.map((s) => this.getQuote(s)));
    }
    getMockQuote(symbol) {
        const mock = this.mockQuotes[symbol];
        if (!mock) {
            throw new common_1.NotFoundException(`Stock symbol '${symbol}' not found`);
        }
        const variation = (Math.random() - 0.5) * 0.02;
        const price = mock.price * (1 + variation);
        const change = price - mock.price;
        return {
            symbol,
            name: mock.name || symbol,
            price: Math.round(price * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round((change / mock.price) * 10000) / 100,
            volume: mock.volume,
            marketCap: mock.marketCap,
            high52w: mock.high52w,
            low52w: mock.low52w,
            timestamp: new Date().toISOString(),
        };
    }
    calculateTechnicalIndicators(quote) {
        const priceRange = quote.high52w - quote.low52w;
        const pricePosition = (quote.price - quote.low52w) / priceRange;
        const rsi = Math.round(30 + pricePosition * 50);
        const movingAverage50 = quote.price * (1 - Math.random() * 0.05);
        const movingAverage200 = quote.price * (1 - Math.random() * 0.1);
        const macdSignal = quote.changePercent > 1 ? 'BULLISH' : quote.changePercent < -1 ? 'BEARISH' : 'NEUTRAL';
        const volumeTrend = quote.changePercent > 0 ? 'INCREASING' : quote.changePercent < 0 ? 'DECREASING' : 'STABLE';
        return {
            rsi,
            macdSignal,
            movingAverage50: Math.round(movingAverage50 * 100) / 100,
            movingAverage200: Math.round(movingAverage200 * 100) / 100,
            volumeTrend,
        };
    }
    generateSwingSignal(quote, indicators) {
        const reasoning = [];
        let bullishPoints = 0;
        let bearishPoints = 0;
        if (indicators.rsi < 30) {
            reasoning.push('RSI indicates oversold conditions — potential reversal');
            bullishPoints += 2;
        }
        else if (indicators.rsi > 70) {
            reasoning.push('RSI indicates overbought conditions — potential pullback');
            bearishPoints += 2;
        }
        else {
            reasoning.push(`RSI at ${indicators.rsi} — neutral momentum`);
        }
        if (indicators.macdSignal === 'BULLISH') {
            reasoning.push('MACD shows bullish crossover signal');
            bullishPoints += 1;
        }
        else if (indicators.macdSignal === 'BEARISH') {
            reasoning.push('MACD shows bearish crossover signal');
            bearishPoints += 1;
        }
        if (quote.price > indicators.movingAverage50) {
            reasoning.push('Price is above 50-day moving average — upward trend');
            bullishPoints += 1;
        }
        else {
            reasoning.push('Price is below 50-day moving average — downward pressure');
            bearishPoints += 1;
        }
        if (indicators.volumeTrend === 'INCREASING' && quote.changePercent > 0) {
            reasoning.push('Volume increasing with price — strong buying pressure');
            bullishPoints += 1;
        }
        else if (indicators.volumeTrend === 'INCREASING' && quote.changePercent < 0) {
            reasoning.push('Volume increasing with price drop — distribution signal');
            bearishPoints += 1;
        }
        const totalPoints = bullishPoints + bearishPoints;
        const confidence = Math.round((Math.max(bullishPoints, bearishPoints) / Math.max(totalPoints, 1)) * 100);
        let type;
        let strength;
        if (bullishPoints > bearishPoints + 1) {
            type = 'BUY';
            strength = bullishPoints >= 4 ? 'STRONG' : bullishPoints >= 2 ? 'MODERATE' : 'WEAK';
        }
        else if (bearishPoints > bullishPoints + 1) {
            type = 'SELL';
            strength = bearishPoints >= 4 ? 'STRONG' : bearishPoints >= 2 ? 'MODERATE' : 'WEAK';
        }
        else {
            type = 'HOLD';
            strength = 'MODERATE';
        }
        return { type, strength, confidence, reasoning };
    }
    calculateTargets(quote, signal) {
        const riskPercent = signal.type === 'BUY' ? 0.05 : 0.08;
        const rewardPercent = riskPercent * 2;
        const targetPrice = signal.type === 'BUY'
            ? Math.round(quote.price * (1 + rewardPercent) * 100) / 100
            : Math.round(quote.price * (1 - rewardPercent) * 100) / 100;
        const stopLoss = signal.type === 'BUY'
            ? Math.round(quote.price * (1 - riskPercent) * 100) / 100
            : Math.round(quote.price * (1 + riskPercent) * 100) / 100;
        return { targetPrice, stopLoss };
    }
    assessRisk(indicators, signal) {
        if (indicators.rsi > 75 || indicators.rsi < 25)
            return 'HIGH';
        if (signal.confidence < 60)
            return 'HIGH';
        if (signal.strength === 'WEAK')
            return 'MEDIUM';
        return signal.confidence > 75 ? 'LOW' : 'MEDIUM';
    }
};
exports.StocksService = StocksService;
exports.StocksService = StocksService = StocksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StocksService);
//# sourceMappingURL=stocks.service.js.map