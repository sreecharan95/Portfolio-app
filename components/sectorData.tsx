"use client";
import { ISectorSummary } from "@/app/alltypes";
import { formatMoney } from "@/potfolioLib/constants";

interface ISector {
  allSectors: ISectorSummary[];
}

export default function SectorData({ allSectors }: ISector) {
  if (!allSectors?.length) {
    return (
      <p className="text-gray-500 text-center mt-6">
        No sector data available
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {allSectors.map((s) => (
        <div
          key={s.sectorVal}
          className="
            p-5 
            rounded-xl 
            border 
            border-gray-200 
            shadow-md 
            bg-gray-50
          "
        >
          <h3 className="font-semibold text-lg mb-3 text-gray-800">
            {s.sectorVal}
          </h3>
          <div className="space-y-1 text-sm text-gray-700">
            <p>
              <span className="font-medium">Investment:</span>{" "}
              {formatMoney(s.totalInvestment)}
            </p>
            <p>
              <span className="font-medium">Present Value:</span>{" "}
              {formatMoney(s.totalPresentValue)}
            </p>
            <p
              className={`font-semibold ${
                s.gainLoss >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              Gain / Loss: {formatMoney(s.gainLoss)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
