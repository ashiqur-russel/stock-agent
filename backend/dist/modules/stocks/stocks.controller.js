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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StocksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const stocks_service_1 = require("./stocks.service");
const analyze_stock_dto_1 = require("./dto/analyze-stock.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let StocksController = class StocksController {
    constructor(stocksService) {
        this.stocksService = stocksService;
    }
    async getMarketOverview() {
        return this.stocksService.getMarketOverview();
    }
    async getQuote(symbol) {
        return this.stocksService.getQuote(symbol);
    }
    async search(query) {
        return this.stocksService.searchStocks(query);
    }
    async analyze(dto) {
        return this.stocksService.analyzeStock(dto);
    }
};
exports.StocksController = StocksController;
__decorate([
    (0, common_1.Get)('market'),
    (0, swagger_1.ApiOperation)({ summary: 'Get market overview (top stocks)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Market overview data' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StocksController.prototype, "getMarketOverview", null);
__decorate([
    (0, common_1.Get)('quote'),
    (0, swagger_1.ApiOperation)({ summary: 'Get real-time stock quote' }),
    (0, swagger_1.ApiQuery)({ name: 'symbol', example: 'AAPL' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stock quote data' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Symbol not found' }),
    __param(0, (0, common_1.Query)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StocksController.prototype, "getQuote", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search for stocks by symbol or name' }),
    (0, swagger_1.ApiQuery)({ name: 'q', example: 'Apple' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StocksController.prototype, "search", null);
__decorate([
    (0, common_1.Post)('analyze'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI-powered swing trading analysis' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stock analysis with trading signal' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Symbol not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analyze_stock_dto_1.AnalyzeStockDto]),
    __metadata("design:returntype", Promise)
], StocksController.prototype, "analyze", null);
exports.StocksController = StocksController = __decorate([
    (0, swagger_1.ApiTags)('stocks'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('stocks'),
    __metadata("design:paramtypes", [stocks_service_1.StocksService])
], StocksController);
//# sourceMappingURL=stocks.controller.js.map