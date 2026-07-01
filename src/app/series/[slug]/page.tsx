import { getSeriesBySlug, getSeriesShiurim, formatDuration } from "@/lib/queries";
import { toHebrewDate } from "@/lib/hebrew-date";
import Header from "@/components/Header";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 3600;

interface PageProps { params: { slug: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const series = await getSeriesBySlug(params.slug);
  if (!series) return { title: "סדרה לא נמצאה" };
  return {
    title: `${series.name} | ערוץ מאיר`,
    description: series.description || `סדרת שיעורים: ${series.name}`,
  };
}

export default async function SeriesPage({ params }: PageProps) {
  const series = await getSeriesBySlug(params.slug);
  if (!series) notFound();

  const episodes = await getSeriesShiurim(series.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        {series.parent && (
          <p className="text-sm text-gray-400 mb-4">
            <Link href={`/series/${series.parent.slug}`} className="hover:text-blue-600 transition-colors">
              {series.parent.name}
            </Link>
            {" › "}
            <span className="text-gray-600">{series.name}</span>
          </p>
        )}

        {/* Series header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{series.name}</h1>
          <p className="text-sm text-blue-600 mb-3">{episodes.length} שיעורים</p>
          {series.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{series.description}</p>
          )}
        </div>

        {/* Episodes list */}
        {episodes.length === 0 ? (
          <div className="text-center py-20 text-gray-400">לא נמצאו שיעורים בסדרה זו</div>
        ) : (
          <div className="flex flex-col gap-3">
            {episodes.map((ep, idx) => {
              const rabbi = ep.rabbis[0]?.rabbi;
              const thumb = ep.vimeoThumbnail || (ep.vimeoId ? `/api/thumb/${ep.vimeoId}` : null);
              const hebrewDate = ep.hebrewDate || toHebrewDate(ep.publishedAt) || null;
              const epNum = ep.episodeNumber ?? (idx + 1);

              return (
                <Link
                  key={ep.id}
                  href={`/shiur/${ep.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex gap-4 p-4 items-start"
                >
                  {/* Episode number */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {epNum}
                  </div>

                  {/* Thumbnail */}
                  {thumb && (
                    <div className="relative w-32 flex-shrink-0 rounded-xl overflow-hidden aspect-video bg-gray-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} alt={ep.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      {ep.lessonLength && (
                        <span className="absolute bottom-1 left-1 bg-black/75 text-white text-xs px-1 rounded font-mono">
                          {formatDuration(ep.lessonLength)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p className="font-medium text-gray-900 text-sm leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                      {ep.title}
                    </p>
                    {rabbi && (
                      <p className="text-xs text-blue-600">{rabbi.name}</p>
                    )}
                    {hebrewDate && (
                      <p className="text-xs text-gray-400">{hebrewDate}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
