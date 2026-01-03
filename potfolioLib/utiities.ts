import { Holding, IMarketData, ISectorSummary, PortfolioRow } from "../app/alltypes";


export function buildPortfolio(
  holdings: Holding[],
  IMarketData: Record<string, IMarketData>
): PortfolioRow[] {
  const totalInvestment = holdings.reduce(
    (sum, h) => sum + h.purchasePriceVal * h.quantity,
    0
  );

  return holdings.map((h) => {
    const market = IMarketData[h.symbol];
    const investment = h.purchasePriceVal * h.quantity;
    const cmpNum = market?.cmpNum ?? 0;
    const presentValue = cmpNum * h.quantity;
    const gainLoss = presentValue - investment;
    const portfolioPercent =
      totalInvestment > 0 ? (investment / totalInvestment) * 100 : 0;

    return {
      ...h,
      investment,
      cmpNum,
      presentValue,
      gainLoss,
      portfolioPercent,
      peRatio: market?.peRatio,
      latestEarnings: market?.latestEarnings,
    };
  });
}

export function getSectorSummary(rows: PortfolioRow[]): ISectorSummary[] {
  const map = new Map<string, ISectorSummary>();

  rows.forEach((r) => {
    const current = map.get(r.sectorVal) ?? {
      sectorVal: r.sectorVal,
      totalInvestment: 0,
      totalPresentValue: 0,
      gainLoss: 0,
    };
    current.totalInvestment += r.investment;
    current.totalPresentValue += r.presentValue;
    current.gainLoss += r.gainLoss;
    map.set(r.sectorVal, current);
  });

  return Array.from(map.values());
}

