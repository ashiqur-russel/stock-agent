import type { StockAnalysis } from '../types';
import { SignalBadge } from './SignalBadge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Shield } from 'lucide-react';

interface Props {
  analysis: StockAnalysis;
}

const riskColors = {
  LOW: 'text-green-600 bg-green-50',
  MEDIUM: 'text-yellow-600 bg-yellow-50',
  HIGH: 'text-red-600 bg-red-50',
};

const macdIcons = {
  BULLISH: <TrendingUp className="h-4 w-4 text-green-500" />,
  BEARISH: <TrendingDown className="h-4 w-4 text-red-500" />,
  NEUTRAL: <Minus className="h-4 w-4 text-gray-500" />,
};

const volumeLabels = {
  INCREASING: '↑ Increasing',
  DECREASING: '↓ Decreasing',
  STABLE: '→ Stable',
};

export function AnalysisPanel({ analysis }: Props) {
  const { quote, signal, technicalIndicators: ti, riskLevel, targetPrice, stopLoss, timeframe } = analysis;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" role="region" aria-label={`Analysis for ${quote.symbol}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{quote.symbol}</h2>
            <p className="text-blue-200 text-sm">{quote.name}</p>
            <p className="text-blue-100 text-xs mt-1 capitalize">{timeframe} analysis</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">${quote.price.toFixed(2)}</p>
            <p className={`text-sm ${quote.changePercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <SignalBadge signal={signal} />
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColors[riskLevel]} border`}>
            <AlertTriangle className="inline h-3 w-3 mr-1" />{riskLevel} RISK
          </span>
        </div>
      </div>

      {/* Price Targets */}
      <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
        <div className="p-4 border-r border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Target className="h-3 w-3" /> TARGET PRICE
          </div>
          <p className="text-xl font-bold text-green-600">${targetPrice.toFixed(2)}</p>
          <p className="text-xs text-gray-400">
            {((targetPrice - quote.price) / quote.price * 100).toFixed(1)}% from current
          </p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Shield className="h-3 w-3" /> STOP LOSS
          </div>
          <p className="text-xl font-bold text-red-600">${stopLoss.toFixed(2)}</p>
          <p className="text-xs text-gray-400">
            {((stopLoss - quote.price) / quote.price * 100).toFixed(1)}% from current
          </p>
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Technical Indicators</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">RSI (14)</p>
            <p className={`text-lg font-bold ${ti.rsi < 30 ? 'text-green-600' : ti.rsi > 70 ? 'text-red-600' : 'text-gray-800'}`}>
              {ti.rsi}
            </p>
            <p className="text-xs text-gray-400">
              {ti.rsi < 30 ? 'Oversold' : ti.rsi > 70 ? 'Overbought' : 'Neutral'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">MACD Signal</p>
            <div className="flex items-center gap-1 mt-1">{macdIcons[ti.macdSignal]}<span className="text-sm font-semibold">{ti.macdSignal}</span></div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">MA 50</p>
            <p className="text-sm font-bold text-gray-800">${ti.movingAverage50.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">MA 200</p>
            <p className="text-sm font-bold text-gray-800">${ti.movingAverage200.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <span>Volume Trend:</span>
          <span className="font-medium text-gray-700">{volumeLabels[ti.volumeTrend]}</span>
        </div>

        {/* Reasoning */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">AI Analysis</h3>
          <ul className="space-y-1" role="list">
            {signal.reasoning.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-blue-400 mt-0.5">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
