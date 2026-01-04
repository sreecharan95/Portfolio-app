/* eslint-disable @typescript-eslint/no-explicit-any */
import { JSX, memo } from "react";
import { flexRender } from "@tanstack/react-table";

interface RowProps {
  row: any;
  idx: number;
}

const PortfolioTableRow = ({ row, idx }: RowProps): JSX.Element => {
  return (
    <tr
      className={`
        ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
        hover:bg-blue-50 transition
      `}
    >
      {row.getVisibleCells().map((cell: any) => (
        <td
          key={cell.id}
          className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap"
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
};

export const MemoizedRow = memo(PortfolioTableRow);
