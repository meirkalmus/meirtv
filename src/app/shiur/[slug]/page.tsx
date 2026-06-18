// ISR: cache each shiur page for 1 hour; revalidates in the background.
// After first visit the page is served from Vercel's CDN in < 50ms.
// Link prefetch on hover also works with ISR, making navigation instant.
export const revalidate = 3600;

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getShiurBySlug, getRelatedShiurim, formatDuration } from "@/lib/queries";
import { toHebrewDate } from "@/lib/hebrew-date";
import type { Metadata } from "next";

interface PageProps { params: { slug: string }; }

// React cache: deduplicates calls within one request
// (so generateMetadata + ShiurPage share one DB round-trip)
const getShiur = cache((slug: string) => getShiurBySlug(slug));

// Next.js data cache: persists the result across requests for 1 hour
const getShiurCached = unstable_cache(
  (slug: string) => getShiurBySlug(slug),
  ["shiur-slug"],
  { revalidate: 3600 }
);

const getRelatedCached = unstable_cache(
  (shiurId: number, rabbiId?: number) => getRelatedShiurim(shiurId, rabbiId),
  ["shiur-related"],
  { revalidate: 3600 }
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const shiur = await getShiur(params.slug);
  if (!shiur) return { title: "שיעור לא נמצא" };
  const rabbi = shiur.rabbis[0]?.rabbi?.name;
  return {
    title: `${shiur.title}${rabbi ? ` | ${rabbi}` : ""}`,
    description: shiur.excerpt || `שיעור תורה: ${shiur.title}`,
    openGraph: {
      title: shiur.title,
      images: shiur.vimeoThumbnail ? [shiur.vimeoThumbnail] : [],
    },
  };
}

export default async function ShiurPage({ params }: PageProps) {
  // Use the persistent cache for the page render
  const shiur = await getShiurCached(params.slug);
  if (!shiur) notFound();

  const primaryRabbi = shiur.rabbis.find(r => r.isPrimary)?.rabbi || shiur.rabbis[0]?.rabbi;

  // Run both queries in parallel
  const related = await getRelatedCached(shiur.id, primaryRabbi?.id);

  const vimeoEmbedUrl = shiur.vimeoId
    ? `https://player.vimeo.com/video/${shiur.vimeoId}?color=d4af37&title=0&byline=0&portrait=0&autoplay=0`
    : null;

  const hebrewDateDisplay = shiur.hebrewDate || toHebrewDate(shiur.publishedAt) || null;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-l from-[#1a1a2e] to-[#0f3460] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-blue-200 hover:text-white transition-colors text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            חזרה לחיפוש
          </Link>
          <span className="text-blue-300">|</span>
          <Link href="/" className="text-white font-bold text-lg">ערוץ מאיר</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Video + Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Video Player */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
              {vimeoEmbedUrl ? (
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    src={vimeoEmbedUrl}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={shiur.title}
                  />
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gray-900 text-gray-500">
                  <div className="text-center">
                    <div className="text-5xl mb-3">🎓</div>
                    <p>הווידאו אינו זמין</p>
                  </div>
                </div>
              )}
            </div>

            {/* Title + Meta */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-4">
                {shiur.title}
              </h1>

              {/* Rabbi(s) */}
              {shiur.rabbis.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {shiur.rabbis.map(({ rabbi, isPrimary }) => (
                    <Link
                      key={rabbi.id}
                      href={`/?rabbiId=${rabbi.id}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isPrimary
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                      {rabbi.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
                {shiur.lessonLength && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDuration(shiur.lessonLength)}
                  </span>
                )}
                {hebrewDateDisplay && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {hebrewDateDisplay}
                  </span>
                )}
                {shiur.pdfMekorot && (
                  <a
                    href={shiur.pdfMekorot}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    דפי מקורות
                  </a>
                )}
                {shiur.mp3Url && (
                  <a
                    href={shiur.mp3Url}
                    className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3.895 3 2zM9 10l12-3" />
                    </svg>
                    האזן
                  </a>
                )}
              </div>
            </div>

            {/* Taxonomy tags */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">

              {shiur.series.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">סדרה</h3>
                  <div className="flex flex-wrap gap-2">
                    {shiur.series.map(({ series }) => (
                      <Link key={series.id} href={`/?seriesId=${series.id}`}
                        className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm hover:bg-purple-100 transition-colors">
                        {series.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {shiur.parashas.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">פרשת השבוע</h3>
                  <div className="flex flex-wrap gap-2">
                    {shiur.parashas.map(({ parasha }) => (
                      <Link key={parasha.id} href={`/?parashaId=${parasha.id}`}
                        className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm hover:bg-amber-100 transition-colors">
                        {parasha.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {shiur.moadim.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">מועד</h3>
                  <div className="flex flex-wrap gap-2">
                    {shiur.moadim.map(({ moed }) => (
                      <Link key={moed.id} href={`/?moedId=${moed.id}`}
                        className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100 transition-colors">
                        {moed.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {shiur.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">תגיות</h3>
                  <div className="flex flex-wrap gap-2">
                    {shiur.tags.map(({ tag }) => (
                      <Link key={tag.id} href={`/?tagId=${tag.id}`}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors">
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Related shiurim */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900">
              {primaryRabbi ? `עוד שיעורים של ${primaryRabbi.name}` : "שיעורים נוספים"}
            </h2>

            {related.map(rel => {
              // Use cached CDN URL directly — avoids the slow proxy API round-trip
              const thumb = rel.vimeoThumbnail || (rel.vimeoId ? `/api/thumb/${rel.vimeoId}` : null);
              const relRabbi = rel.rabbis[0]?.rabbi;
              return (
                <Link
                  key={rel.id}
                  href={`/shiur/${rel.slug}`}
                  className="flex gap-3 group bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-all"
                >
                  {thumb && (
                    <div className="relative w-28 flex-shrink-0 rounded-lg overflow-hidden aspect-video bg-gray-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} alt={rel.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      {rel.lessonLength && (
                        <span className="absolute bottom-1 left-1 bg-black/75 text-white text-xs px-1 rounded">
                          {formatDuration(rel.lessonLength)}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
                      {rel.title}
                    </p>
                    {relRabbi && <p className="text-xs text-blue-600">{relRabbi.name}</p>}
                  </div>
                </Link>
              );
            })}

            {primaryRabbi && (
              <Link
                href={`/?rabbiId=${primaryRabbi.id}`}
                className="text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors"
              >
                כל השיעורים של {primaryRabbi.name} ←
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
