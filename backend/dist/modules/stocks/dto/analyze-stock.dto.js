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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzeStockDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class AnalyzeStockDto {
}
exports.AnalyzeStockDto = AnalyzeStockDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'AAPL', description: 'Stock ticker symbol' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 10),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase().trim()),
    __metadata("design:type", String)
], AnalyzeStockDto.prototype, "symbol", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'weekly',
        description: 'Analysis timeframe',
        enum: ['daily', 'weekly', 'monthly'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['daily', 'weekly', 'monthly']),
    __metadata("design:type", String)
], AnalyzeStockDto.prototype, "timeframe", void 0);
//# sourceMappingURL=analyze-stock.dto.js.map