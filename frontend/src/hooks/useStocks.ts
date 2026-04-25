import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { StockQuote, StockAnalysis, SearchResult } from '../types';

export function useMarketOverview() {
  return useQuery<StockQuote[]>({
    queryKey: ['market-overview'],
    queryFn: async () => {
      const { data } = await apiClient.get('/stocks/market');
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useStockQuote(symbol: string) {
  return useQuery<StockQuote>({
    queryKey: ['quote', symbol],
    queryFn: async () => {
      const { data } = await apiClient.get(`/stocks/quote?symbol=${symbol}`);
      return data;
    },
    enabled: !!symbol,
    staleTime: 30_000,
  });
}

export function useStockSearch(query: string) {
  return useQuery<SearchResult[]>({
    queryKey: ['search', query],
    queryFn: async () => {
      const { data } = await apiClient.get(`/stocks/search?q=${encodeURIComponent(query)}`);
      return data;
    },
    enabled: query.length >= 1,
    staleTime: 60_000,
  });
}

export function useAnalyzeStock() {
  return useMutation<StockAnalysis, Error, { symbol: string; timeframe?: string }>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/stocks/analyze', payload);
      return data;
    },
  });
}
