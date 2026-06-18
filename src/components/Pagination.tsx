"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PaginationProps { page: number; pages: number; }

export default function Pagination({ page, pages }: PaginationProps) {
  const params = useSearchParams();
  if (pages <= 1) return null;

  const getHref = (p: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(p));
    return `/?${next.toString()}`;
  };

  const range: (number | "...")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
      range.push(i);
    } else if (range[range.length - 1] !== "...") {
      range.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      {page > 1 && (
        <Link href={getHref(page - 1)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
          הקודם
        </Link>
      )}
      {range.map((r, i) =>
        r === "..." ? (
          <span key={i} className="px-2 text-gray-400">…</span>
        ) : (
          <Link
            key={r}
            href={getHref(r as number)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              r === page
                ? "bg-blue-600 text-white"
                : "border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {r}
          </Link>
        )
      )}
      {page < pages && (
        <Link href={getHref(page + 1)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
          הבא
        </Link>
      )}
    </div>
  );
}
