import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class AnalyzeStockDto {
  @ApiProperty({ example: 'AAPL', description: 'Stock ticker symbol' })
  @IsString()
  @Length(1, 10)
  @Transform(({ value }) => value?.toUpperCase().trim())
  symbol: string;

  @ApiPropertyOptional({
    example: 'weekly',
    description: 'Analysis timeframe',
    enum: ['daily', 'weekly', 'monthly'],
  })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  timeframe?: 'daily' | 'weekly' | 'monthly';
}
