"use client";

import { PortfolioRow } from "@/app/alltypes";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { useMemo } from "react";
import { portfolioColumns } from "./portfolioCols";

interface Props {
  data: PortfolioRow[];
}

export default function PortfolioTable({ data }: Props) {
    const columns = useMemo(() => portfolioColumns, []);
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id} className="bg-gray-100 text-gray-700 px-4 py-3 text-sm font-semibold border-b border-gray-300 whitespace-nowrap">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-3 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
