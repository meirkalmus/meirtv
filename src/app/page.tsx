export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { searchShiurim, getFilterOptions } from "@/lib/queries";
import type { SortOption } from "@/lib/queries";
import { toHebrewDate } from "@/lib/hebrew-date";
import ShiurCard from "@/components/ShiurCard";
import SearchFilters from "@/components/SearchFilters";
import Pagination from "@/components/Pagination";
import Header from "@/components/Header";
import type { Metadata } from "next";

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
    sort?: string;
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const filters = {
    q: searchParams.q,
    rabbiId:    searchParams.rabbiId    ? Number(searchParams.rabbiId)    : undefined,
    seriesId:   searchParams.seriesId   ? Number(searchParams.seriesId)   : undefined,
    tagId:      searchParams.tagId      ? Number(searchParams.tagId)      : undefined,
    parashaId:  searchParams.parashaId  ? Number(searchParams.parashaId)  : undefined,
    moedId:     searchParams.moedId     ? Number(searchParams.moedId)     : undefined,
    madorId:    searchParams.madorId    ? Number(searchParams.madorId)    : undefined,
    categoryId: searchParams.categoryId ? Number(searchParams.categoryId) : undefined,
    page: searchParams.page ? Number(searchParams.page) : 1,
    sort: (searchParams.sort || "publishedAt_desc") as SortOption,
  };

  const [{ shiurim, total, pages, page }, filterOptions] = await Promise.all([
    searchShiurim(filters),
    getFilterOptions(filters),
  ]).catch((e: Error) => {
    throw new Error(`Database error: ${e.message}`);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header total={total} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Suspense>
          <SearchFilters {...filterOptions} total={total} />
        </Suspense>

        {shiurim.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">לא נמצאו שיעורים</p>
            <p className="text-gray-400 text-sm mt-1">נסה לשנות את הסינון</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">עמוד {page} מתוך {pages}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {shiurim.map(shiur => {
                const { publishedAt, hebrewDate, ...shiurRest } = shiur;
                const hebrewDateDisplay = hebrewDate || toHebrewDate(publishedAt) || null;
                const gregorianDate = publishedAt
                  ? (() => {
                      const d = new Date(publishedAt);
                      const dd = d.getDate().toString().padStart(2, "0");
                      const mm = (d.getMonth() + 1).toString().padStart(2, "0");
                      const yy = d.getFullYear().toString().slice(-2);
                      return `${dd}/${mm}/${yy}`;
                    })()
                  : null;
                return (
                  <ShiurCard
                    key={shiur.id}
                    shiur={{ ...shiurRest, hebrewDate: hebrewDateDisplay, publishedAtFormatted: gregorianDate }}
                  />
                );
              })}
            </div>
          </>
        )}

        <Suspense>
          <Pagination page={page} pages={pages} />
        </Suspense>
      </main>
    </div>
  );
}
