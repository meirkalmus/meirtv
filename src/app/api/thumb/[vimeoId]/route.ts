import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cache thumbnail URLs in PostgreSQL to avoid repeated Vimeo API calls
export async function GET(
  _req: NextRequest,
  { params }: { params: { vimeoId: string } }
) {
  const vimeoId = params.vimeoId.replace(/[^0-9]/g, "");
  if (!vimeoId) return new NextResponse(null, { status: 400 });

  // Check if we already have it cached in our DB
  const cached = await prisma.shiur.findFirst({
    where: { vimeoId, vimeoThumbnail: { not: null } },
    select: { vimeoThumbnail: true },
  }).catch(() => null);

  if (cached?.vimeoThumbnail && cached.vimeoThumbnail.startsWith("http")) {
    return NextResponse.redirect(cached.vimeoThumbnail, { status: 302 });
  }

  // Fetch from Vimeo public API (no auth needed)
  try {
    const res = await fetch(
      `https://vimeo.com/api/v2/video/${vimeoId}.json`,
      { next: { revalidate: 86400 } } // cache 24h
    );
    if (!res.ok) return new NextResponse(null, { status: 404 });

    const data = await res.json();
    const thumbUrl: string = data[0]?.thumbnail_large || data[0]?.thumbnail_medium || data[0]?.thumbnail_small;

    if (!thumbUrl) return new NextResponse(null, { status: 404 });

    // Save to DB for future requests
    await prisma.shiur.updateMany({
      where: { vimeoId },
      data: { vimeoThumbnail: thumbUrl },
    }).catch(() => {});

    return NextResponse.redirect(thumbUrl, { status: 302 });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
