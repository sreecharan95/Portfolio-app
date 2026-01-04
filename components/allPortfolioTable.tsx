/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/incompatible-library */
"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { PortfolioRow } from "@/app/alltypes";
import { portfolioColumns } from "./portfolioCols";
import { MemoizedRow } from "./rowComponent";

interface Props {
  data: PortfolioRow[];
}
interface ISearch {
  value: string;
  onChange: (v: string) => void;
}

function PortfolioCard({ data }: any) {
  return (
    <div className="space-y-4">
      {data.map((row: any) => (
        <div
          key={row.id}
          className="rounded-xl border bg-white p-4 shadow-sm"
        >
          {row.getVisibleCells().map((cell: any) => (
            <div key={cell.id} className="flex justify-between py-1 text-sm">
              <span className="font-medium text-gray-600">
                {flexRender(
                  cell.column.columnDef.header,
                  cell.getContext()
                )}
              </span>
              <span className="text-gray-800">
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                )}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

 function Search({ value, onChange }: ISearch) {
  return (
    <div className="mb-4">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search..."
        className="
          w-full md:w-80
          px-4 py-2
          border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      />
    </div>
  );
}

export default function PortfolioTable({ data }: Props) {
  const columns = useMemo(() => portfolioColumns, []);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <>
      <Search
        value={globalFilter}
        onChange={setGlobalFilter}
      />
      <div className="block md:hidden">
        <PortfolioCard data={table.getRowModel().rows} />
      </div>
      <div className="hidden md:block overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full border-collapse">
        <thead className="bg-blue-100 sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                 <th
                 key={header.id}
                 onClick={header.column.getToggleSortingHandler()}
                 className="px-4 py-3 text-left text-xs font-semibold uppercase text-blue-900 border-b border-blue-200
                 cursor-pointer select-none hover:bg-blue-200 transition">
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() === "asc" && "▲"}
                      {header.column.getIsSorted() === "desc" && "▼"}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <MemoizedRow key={row.id} row={row} idx={idx} />
            ))}
            {!data.length && (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-gray-500">
                  No portfolio data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
