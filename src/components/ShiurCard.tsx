import Link from "next/link";
import Image from "next/image";
import { formatDuration } from "@/lib/queries";

interface ShiurCardProps {
  shiur: {
    id: number;
    slug: string;
    title: string;
    vimeoId: string | null;
    vimeoThumbnail: string | null;
    lessonLength: number | null;
    hebrewDate: string | null;
    publishedAt: Date | null;
    rabbis: { rabbi: { name: string; slug: string } }[];
    series: { series: { name: string; slug: string } }[];
  };
}

export default function ShiurCard({ shiur }: ShiurCardProps) {
  const rabbi = shiur.rabbis[0]?.rabbi;
  const series = shiur.series[0]?.series;
  const thumbnail =
    shiur.vimeoThumbnail ||
    (shiur.vimeoId
      ? `https://vumbnail.com/${shiur.vimeoId}.jpg`
      : "/placeholder-shiur.jpg");

  return (
    <Link
      href={`/shiur/${shiur.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <Image
          src={thumbnail}
          alt={shiur.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized={!!shiur.vimeoThumbnail}
        />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
            <svg className="w-6 h-6 text-brand-500 mr-[-3px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Duration badge */}
        {shiur.lessonLength && (
          <span className="absolute bottom-2 left-2 bg-black/75 text-white text-xs px-2 py-0.5 rounded-md font-mono">
            {formatDuration(shiur.lessonLength)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-gray-900 line-clamp-2 text-sm leading-snug group-hover:text-blue-700 transition-colors">
          {shiur.title}
        </h3>

        <div className="mt-auto flex flex-col gap-1">
          {rabbi && (
            <span className="text-xs text-blue-700 font-medium">
              {rabbi.name}
            </span>
          )}
          {series && (
            <span className="text-xs text-gray-400 line-clamp-1">
              {series.name}
            </span>
          )}
          {shiur.hebrewDate && (
            <span className="text-xs text-gray-400">{shiur.hebrewDate}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
