"use client";

import Link from "next/link";
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
    publishedAtFormatted: string | null;
    rabbis: { rabbi: { name: string; slug: string } }[];
    series: { series: { name: string; slug: string } }[];
  };
}

export default function ShiurCard({ shiur }: ShiurCardProps) {
  const rabbi = shiur.rabbis[0]?.rabbi;
  const series = shiur.series[0]?.series;
  // Use cached CDN URL directly (fast); only fall back to proxy API when not yet cached
  const thumbUrl = shiur.vimeoThumbnail
    || (shiur.vimeoId ? `/api/thumb/${shiur.vimeoId}` : null);

  return (
    <Link
      href={`/shiur/${shiur.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative w-full overflow-hidden rounded-t-2xl" style={{ paddingTop: "56.25%" }}>
        {/* Fallback shown when no vimeoId or image fails */}
        <div
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            background: "#1e293b",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem",
          }}
        >
          🎓
        </div>

        {thumbUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt=""
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            style={{
              position: "absolute",
              top: 0, left: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Duration badge */}
        {shiur.lessonLength && (
          <span
            style={{
              position: "absolute", bottom: 6, left: 6,
              background: "rgba(0,0,0,0.75)",
              color: "#fff", fontSize: "11px",
              padding: "2px 6px", borderRadius: 4,
              fontFamily: "monospace",
            }}
          >
            {formatDuration(shiur.lessonLength)}
          </span>
        )}

        {/* Play overlay */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,255,255,0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="20" height="20" fill="#0f3460" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3 className="font-bold text-gray-900 line-clamp-2 text-sm leading-snug group-hover:text-blue-700 transition-colors">
          {shiur.title}
        </h3>
        <div className="mt-auto pt-1 flex flex-col gap-0.5">
          {rabbi && (
            <span className="text-xs text-blue-700 font-medium truncate">{rabbi.name}</span>
          )}
          {series && (
            <span className="text-xs text-gray-400 truncate">{series.name}</span>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            {shiur.hebrewDate && (
              <span className="text-xs text-gray-400">{shiur.hebrewDate}</span>
            )}
            {shiur.publishedAtFormatted && (
              <span className="text-xs text-gray-300">{shiur.publishedAtFormatted}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
