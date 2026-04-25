import type { StockQuote } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  quote: StockQuote;
  onClick?: () => void;
}

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(2)}`;
}

export function StockCard({ quote, onClick }: Props) {
  const isPositive = quote.changePercent >= 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={`${quote.symbol} — ${quote.name}, price $${quote.price}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-lg font-bold text-gray-900">{quote.symbol}</span>
          <p className="text-xs text-gray-500 truncate max-w-[140px]">{quote.name}</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
        </div>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">${quote.price.toFixed(2)}</span>
        <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{quote.change.toFixed(2)}
        </span>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between text-xs text-gray-400">
        <span>Mkt Cap {formatLargeNumber(quote.marketCap)}</span>
        <span>52w {quote.low52w.toFixed(0)}–{quote.high52w.toFixed(0)}</span>
      </div>
    </button>
  );
}
