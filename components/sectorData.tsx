"use client";

import { ISectorSummary } from "@/app/alltypes";
import { formatMoney } from "@/potfolioLib/constants";
interface ISector {
  allSectors: ISectorSummary[];
}

export default function SectorData({ allSectors }: ISector) {
  if (!allSectors.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {allSectors.map((s) => (
        <div key={s.sectorVal} className="p-4 rounded-xl shadow bg-white">
          <h3 className="font-semibold text-lg">{s.sectorVal}</h3>
          <p>Investment: {formatMoney(s.totalInvestment)}</p>
          <p>Present Value: {formatMoney(s.totalPresentValue)}</p>
          <p className={s.gainLoss >= 0 ? "text-green-600" : "text-red-600"}>
            Gain/Loss: {formatMoney(s.gainLoss)}
          </p>
        </div>
      ))}
    </div>
  );
}
