import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fetches Vimeo thumbnails in bulk for all shiurim that have a vimeoId but no cached thumbnail.
// Call GET /api/populate-thumbs to run one batch (100 videos).
// Call with ?all=1 to run all batches sequentially.
export async function GET(req: NextRequest) {
  const batchSize = 50;

  const uncached = await prisma.shiur.findMany({
    where: {
      vimeoId: { not: null },
      vimeoThumbnail: null,
    },
    select: { id: true, vimeoId: true },
    take: batchSize,
  });

  if (uncached.length === 0) {
    const total = await prisma.shiur.count({ where: { vimeoThumbnail: { not: null } } });
    return NextResponse.json({ done: true, cached: total, message: "All thumbnails already cached" });
  }

  let fetched = 0;
  let failed = 0;

  await Promise.all(
    uncached.map(async (shiur) => {
      if (!shiur.vimeoId) return;
      try {
        const res = await fetch(
          `https://vimeo.com/api/v2/video/${shiur.vimeoId}.json`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) { failed++; return; }
        const data = await res.json();
        const thumbUrl: string =
          data[0]?.thumbnail_large ||
          data[0]?.thumbnail_medium ||
          data[0]?.thumbnail_small;
        if (!thumbUrl) { failed++; return; }
        await prisma.shiur.update({
          where: { id: shiur.id },
          data: { vimeoThumbnail: thumbUrl },
        });
        fetched++;
      } catch {
        failed++;
      }
    })
  );

  const remaining = await prisma.shiur.count({
    where: { vimeoId: { not: null }, vimeoThumbnail: null },
  });

  return NextResponse.json({
    done: remaining === 0,
    fetched,
    failed,
    remaining,
    message: remaining > 0
      ? `Fetched ${fetched}, failed ${failed}. ${remaining} remaining — call again to continue.`
      : `All done! Fetched ${fetched}, failed ${failed}.`,
  });
}
