import { getRabbiBySlug, searchShiurim } from "@/lib/queries";
import type { SortOption } from "@/lib/queries";
import { toHebrewDate } from "@/lib/hebrew-date";
import Header from "@/components/Header";
import ShiurCard from "@/components/ShiurCard";
import Pagination from "@/components/Pagination";
import SortSelect from "@/components/SortSelect";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string; sort?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const rabbi = await getRabbiBySlug(params.slug);
  if (!rabbi) return { title: "רב לא נמצא" };
  return {
    title: `${rabbi.name} | ערוץ מאיר`,
    description: rabbi.description || `שיעורים של ${rabbi.name}`,
  };
}

export default async function RabbiPage({ params, searchParams }: PageProps) {
  const rabbi = await getRabbiBySlug(params.slug);
  if (!rabbi) notFound();

  const sort = (searchParams.sort || "publishedAt_desc") as SortOption;
  const page = searchParams.page ? Number(searchParams.page) : 1;

  const { shiurim, total, pages } = await searchShiurim({ rabbiId: rabbi.id, sort, page });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Rabbi profile */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 flex items-start gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
            {rabbi.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rabbi.picture} alt={rabbi.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-blue-600">{rabbi.name.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{rabbi.name}</h1>
            <p className="text-sm text-blue-600 mb-3">{total.toLocaleString("he-IL")} שיעורים</p>
            {rabbi.description && (
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{rabbi.description}</p>
            )}
          </div>
        </div>

        {/* Sort + count row */}
        <div className="flex items-center justify-between mb-5 gap-4">
          <p className="text-sm text-gray-500">
            {total.toLocaleString("he-IL")} שיעורים · עמוד {page} מתוך {pages}
          </p>
          <SortSelect value={sort} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {shiurim.map(shiur => {
            const { publishedAt, hebrewDate, ...shiurRest } = shiur;
            const hebrewDateDisplay = hebrewDate || toHebrewDate(publishedAt) || null;
            const gregorianDate = publishedAt
              ? (() => {
                  const d = new Date(publishedAt);
                  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear().toString().slice(-2)}`;
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

        <Pagination page={page} pages={pages} />
      </main>
    </div>
  );
}
