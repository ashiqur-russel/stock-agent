export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

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

export interface TechnicalIndicators {
  rsi: number;
  macdSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  movingAverage50: number;
  movingAverage200: number;
  volumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

export interface StockAnalysis {
  quote: StockQuote;
  signal: SwingSignal;
  technicalIndicators: TechnicalIndicators;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
}
