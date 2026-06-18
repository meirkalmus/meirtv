export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { searchShiurim, getFilterOptions } from "@/lib/queries";
import ShiurCard from "@/components/ShiurCard";
import SearchFilters from "@/components/SearchFilters";
import Pagination from "@/components/Pagination";
import type { Metadata } from "next";

// Locale-independent date format DD/MM/YYYY — safe in all Node.js environments
function formatShiurDate(date: Date): string {
  try {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

export const metadata: Metadata = {
  title: "חיפוש שיעורים | ערוץ מאיר",
  description: "חפש מתוך אלפי שיעורי תורה בווידאו ואודיו",
};

interface PageProps {
  searchParams: {
    q?: string;
    rabbiId?: string;
    seriesId?: string;
    tagId?: string;
    parashaId?: string;
    moedId?: string;
    madorId?: string;
    categoryId?: string;
    page?: string;
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const filters = {
    q: searchParams.q,
    rabbiId: searchParams.rabbiId ? Number(searchParams.rabbiId) : undefined,
    seriesId: searchParams.seriesId ? Number(searchParams.seriesId) : undefined,
    tagId: searchParams.tagId ? Number(searchParams.tagId) : undefined,
    parashaId: searchParams.parashaId ? Number(searchParams.parashaId) : undefined,
    moedId: searchParams.moedId ? Number(searchParams.moedId) : undefined,
    madorId: searchParams.madorId ? Number(searchParams.madorId) : undefined,
    categoryId: searchParams.categoryId ? Number(searchParams.categoryId) : undefined,
    page: searchParams.page ? Number(searchParams.page) : 1,
  };

  const [{ shiurim, total, pages, page }, filterOptions] = await Promise.all([
    searchShiurim(filters),
    getFilterOptions(filters),        // pass current filters → faceted counts
  ]).catch((e: Error) => {
    throw new Error(`Database error: ${e.message}`);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-l from-[#1a1a2e] to-[#0f3460] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ערוץ מאיר</h1>
            <p className="text-blue-200 text-sm">אתר היהדות הגדול בעולם</p>
          </div>
          <div className="text-left text-sm text-blue-200">
            <span className="text-white font-bold text-lg">{total.toLocaleString("he-IL")}</span>
            <br />שיעורים
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <Suspense>
          <SearchFilters {...filterOptions} total={total} />
        </Suspense>

        {/* Results count */}
        <div className="mt-6 mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filters.q || filters.rabbiId || filters.seriesId || filters.parashaId || filters.moedId || filters.madorId || filters.categoryId
              ? `${total.toLocaleString("he-IL")} תוצאות`
              : `${total.toLocaleString("he-IL")} שיעורים`}
          </p>
          <p className="text-sm text-gray-400">עמוד {page} מתוך {pages}</p>
        </div>

        {/* Grid */}
        {shiurim.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">לא נמצאו שיעורים</p>
            <p className="text-gray-400 text-sm mt-1">נסה לשנות את הסינון</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {shiurim.map(shiur => {
              // Destructure out the Date object — don't pass it to the Client Component
              const { publishedAt, ...shiurRest } = shiur;
              const publishedAtFormatted = publishedAt
                ? formatShiurDate(publishedAt)
                : null;
              return (
                <ShiurCard
                  key={shiur.id}
                  shiur={{ ...shiurRest, publishedAtFormatted }}
                />
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <Suspense>
          <Pagination page={page} pages={pages} />
        </Suspense>
      </main>
    </div>
  );
}
