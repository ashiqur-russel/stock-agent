import { useState } from 'react';
import { useMarketOverview, useAnalyzeStock, useStockSearch } from '../hooks/useStocks';
import { StockCard } from '../components/StockCard';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Search, RefreshCw, BarChart2 } from 'lucide-react';
import type { StockAnalysis } from '../types';

export function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);

  const { data: market, isLoading: marketLoading, refetch: refetchMarket } = useMarketOverview();
  const { data: searchResults } = useStockSearch(searchQuery);
  const analyzeMutation = useAnalyzeStock();

  const handleAnalyze = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setSearchQuery('');
    try {
      const result = await analyzeMutation.mutateAsync({ symbol, timeframe });
      setAnalysis(result);
    } catch {
      // error handled by mutation state
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart2 className="h-8 w-8 text-blue-600" aria-hidden="true" />
          AI Swing Trading Advisor
        </h1>
        <p className="text-gray-500 mt-1">Search a stock and get AI-powered swing trading signals</p>
      </div>

      {/* Search + Analyze */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by symbol or company name (e.g. AAPL, Apple)"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              aria-label="Search stocks"
            />
            {searchResults && searchResults.length > 0 && searchQuery && (
              <ul className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto" role="listbox" aria-label="Search suggestions">
                {searchResults.map((r) => (
                  <li key={r.symbol}>
                    <button
                      onClick={() => handleAnalyze(r.symbol)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm flex items-center justify-between"
                      role="option"
                    >
                      <span className="font-semibold">{r.symbol}</span>
                      <span className="text-gray-500 text-xs">{r.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            aria-label="Analysis timeframe"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <button
            onClick={() => selectedSymbol && handleAnalyze(selectedSymbol)}
            disabled={!selectedSymbol || analyzeMutation.isPending}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-sm whitespace-nowrap"
          >
            {analyzeMutation.isPending ? <LoadingSpinner size="sm" /> : <BarChart2 className="h-4 w-4" />}
            Analyze
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Market Overview */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Market Overview</h2>
            <button
              onClick={() => refetchMarket()}
              className="text-gray-400 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
              aria-label="Refresh market data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {marketLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <div className="grid gap-3" role="list" aria-label="Market overview stocks">
              {market?.map((quote) => (
                <div key={quote.symbol} role="listitem">
                  <StockCard quote={quote} onClick={() => handleAnalyze(quote.symbol)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analysis Panel */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {analysis ? `Analysis: ${analysis.quote.symbol}` : 'Stock Analysis'}
          </h2>

          {analyzeMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm">Analyzing {selectedSymbol}...</p>
            </div>
          )}

          {analyzeMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700" role="alert">
              <p className="font-semibold">Analysis failed</p>
              <p className="text-sm mt-1">{(analyzeMutation.error as any)?.response?.data?.message?.error || 'An error occurred. Please try again.'}</p>
            </div>
          )}

          {!analyzeMutation.isPending && !analyzeMutation.isError && analysis && (
            <AnalysisPanel analysis={analysis} />
          )}

          {!analyzeMutation.isPending && !analyzeMutation.isError && !analysis && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-xl border border-gray-100">
              <BarChart2 className="h-16 w-16 mb-4 opacity-30" aria-hidden="true" />
              <p className="text-lg font-medium">Select a stock to analyze</p>
              <p className="text-sm mt-1">Click any stock in the market overview or search above</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
