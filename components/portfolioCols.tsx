import { PortfolioRow } from "@/app/alltypes";
import { formatMoney, formatPercent } from "@/potfolioLib/constants";
import { ColumnDef } from "@tanstack/react-table";

export const portfolioColumns: ColumnDef<PortfolioRow>[] = [
  { header: "Particulars", accessorKey: "stockName" },
  {
    header: "Purchase Price",
    accessorKey: "purchasePriceVal",
    cell: ({ getValue }) => formatMoney(getValue<number>()),
  },
  { header: "Qty", accessorKey: "quantity" },
  {
    header: "Investment",
    accessorKey: "investment",
    cell: ({ getValue }) => formatMoney(getValue<number>()),
  },
  {
    header: "Portfolio %",
    accessorKey: "portfolioPercent",
    cell: ({ getValue }) => formatPercent(getValue<number>()),
  },
  { header: "NSE/BSE", accessorKey: "exchange" },
  {
    header: "CMP",
    accessorKey: "cmp",
    cell: ({ getValue }) => formatMoney(getValue<number>()),
  },
  {
    header: "Present Value",
    accessorKey: "presentValue",
    cell: ({ getValue }) => formatMoney(getValue<number>()),
  },
  {
    header: "Gain/Loss",
    accessorKey: "gainLoss",
    cell: ({ getValue }) => {
      const v = getValue<number>();
      return (
        <span className={v >= 0 ? "text-green-600" : "text-red-600"}>
          {formatMoney(v)}
        </span>
      );
    },
  },
  {
    header: "P/E Ratio",
    accessorKey: "peRatio",
    cell: ({ getValue }) => getValue<number>() ?? "—",
  },
  {
    header: "Latest Earnings",
    accessorKey: "latestEarnings",
    cell: ({ getValue }) => getValue<number>() ?? "—",
  },
];
