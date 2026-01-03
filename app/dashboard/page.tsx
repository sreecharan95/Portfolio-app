"use client";

import { buildPortfolio, getSectorSummary } from "@/potfolioLib/utiities";
import { Holding, IMarketData } from "../alltypes";
import PortfolioTable from "@/components/allPortfolioTable";
import SectorData from "@/components/sectorData";


const holdings: Holding[] = [
  { holdingId: "1", stockName: "TCS", symbol: "TCS", sectorVal: "Technology", exchangeVal: "NSE", purchasePriceVal: 3200, quantity: 10 },
  { holdingId: "2", stockName: "HDFC", symbol: "HDFC", sectorVal: "Financials", exchangeVal: "NSE", purchasePriceVal: 1500, quantity: 20 },
];

const marketData: Record<string, IMarketData> = {
  TCS: { cmpNum: 3450, peRatio: 28, latestEarnings: 120 },
  HDFC: { cmpNum: 1600, peRatio: 22, latestEarnings: 80 },
};

export default function DashboardPage() {
  const rows = buildPortfolio(holdings, marketData);
  const sectors = getSectorSummary(rows);

  return (
    <div className="p-6 space-y-6">
      <PortfolioTable data={rows} />
      <SectorData allSectors={sectors} />
    </div>
  );
}
