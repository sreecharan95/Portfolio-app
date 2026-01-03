export type Exchange = "NSE" | "BSE";

export interface Holding {
  holdingId: string;
  stockName: string;
  symbol: string;
  sectorVal: string;
  exchangeVal: Exchange;
  purchasePriceVal: number;
  quantity: number;
}

export interface ISectorSummary {
  sectorVal: string;
  totalInvestment: number;
  totalPresentValue: number;
  gainLoss: number;
}

export interface IMarketData {
  symbol?: string;
  cmpNum: number;
  peRatio?: number;
  latestEarnings?: number;
}

export interface PortfolioRow extends Holding {
  investment: number;
  portfolioPercent: number;
  presentValue: number;
  gainLoss: number;
  cmpNum: number;
  peRatio?: number;
  latestEarnings?: number;
}
