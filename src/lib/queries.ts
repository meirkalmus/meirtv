import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export type SortOption = "publishedAt_desc" | "publishedAt_asc" | "lessonLength_asc" | "lessonLength_desc";

export interface ShiurFilters {
  q?: string;
  rabbiId?: number;
  seriesId?: number;
  tagId?: number;
  parashaId?: number;
  moedId?: number;
  madorId?: number;
  categoryId?: number;
  page?: number;
  sort?: SortOption;
}

const PER_PAGE = 24;

export async function searchShiurim(filters: ShiurFilters) {
  const page = Math.max(1, filters.page || 1);
  const skip = (page - 1) * PER_PAGE;

  const where: Prisma.ShiurWhereInput = {
    status: "publish",
    ...(filters.q && {
      title: { contains: filters.q, mode: "insensitive" },
    }),
    ...(filters.rabbiId && {
      rabbis: { some: { rabbiId: filters.rabbiId } },
    }),
    ...(filters.seriesId && {
      series: { some: { seriesId: filters.seriesId } },
    }),
    ...(filters.tagId && {
      tags: { some: { tagId: filters.tagId } },
    }),
    ...(filters.parashaId && {
      parashas: { some: { parashaId: filters.parashaId } },
    }),
    ...(filters.moedId && {
      moadim: { some: { moedId: filters.moedId } },
    }),
    ...(filters.madorId && {
      madars: { some: { madorId: filters.madorId } },
    }),
    ...(filters.categoryId && {
      categories: { some: { categoryId: filters.categoryId } },
    }),
  };

  const [shiurim, total] = await Promise.all([
    prisma.shiur.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        vimeoId: true,
        vimeoThumbnail: true,
        lessonLength: true,
        hebrewDate: true,
        publishedAt: true,
        rabbis: {
          take: 1,
          orderBy: { isPrimary: "desc" },
          select: { rabbi: { select: { name: true, slug: true } } },
        },
        series: {
          take: 1,
          select: { series: { select: { name: true, slug: true } } },
        },
      },
      orderBy: filters.sort === "publishedAt_asc"   ? [{ publishedAt: "asc" }]
             : filters.sort === "lessonLength_asc"  ? [{ lessonLength: "asc" }]
             : filters.sort === "lessonLength_desc" ? [{ lessonLength: "desc" }]
             :                                        [{ publishedAt: "desc" }],
      skip,
      take: PER_PAGE,
    }),
    prisma.shiur.count({ where }),
  ]);

  return {
    shiurim,
    total,
    pages: Math.ceil(total / PER_PAGE),
    page,
  };
}

export interface FacetOption {
  id: number;
  name: string;
  count: number;
}

/**
 * Returns filter options with shiur counts, respecting the current active filters.
 * Each dimension excludes its own filter when counting so the selected value still
 * appears. This implements classic "AND" faceted search.
 */
export async function getFilterOptions(filters: Omit<ShiurFilters, "page"> = {}) {
  const { q, rabbiId, seriesId, parashaId, moedId, madorId, categoryId } = filters;

  // Builds the parameterized WHERE clause for shiurim, excluding one dimension
  function buildWhere(exclude: string): { sql: string; params: (string | number)[] } {
    const conds: string[] = [`s.status = 'publish'`];
    const params: (string | number)[] = [];
    const p = () => `$${params.length + 1}`;

    if (q) {
      conds.push(`s.title ILIKE ${p()}`); params.push(`%${q}%`);
    }
    if (rabbiId && exclude !== "rabbi") {
      conds.push(`EXISTS (SELECT 1 FROM "shiur_rabbi" x WHERE x.shiur_id = s.id AND x.rabbi_id = ${p()})`);
      params.push(rabbiId);
    }
    if (seriesId && exclude !== "series") {
      conds.push(`EXISTS (SELECT 1 FROM "shiur_series" x WHERE x.shiur_id = s.id AND x.series_id = ${p()})`);
      params.push(seriesId);
    }
    if (parashaId && exclude !== "parasha") {
      conds.push(`EXISTS (SELECT 1 FROM "shiur_parasha" x WHERE x.shiur_id = s.id AND x.parasha_id = ${p()})`);
      params.push(parashaId);
    }
    if (moedId && exclude !== "moed") {
      conds.push(`EXISTS (SELECT 1 FROM "shiur_moadim" x WHERE x.shiur_id = s.id AND x.moed_id = ${p()})`);
      params.push(moedId);
    }
    if (madorId && exclude !== "mador") {
      conds.push(`EXISTS (SELECT 1 FROM "shiur_mador" x WHERE x.shiur_id = s.id AND x.mador_id = ${p()})`);
      params.push(madorId);
    }
    if (categoryId && exclude !== "category") {
      conds.push(`EXISTS (SELECT 1 FROM "shiur_category" x WHERE x.shiur_id = s.id AND x.category_id = ${p()})`);
      params.push(categoryId);
    }

    return { sql: conds.join(" AND "), params };
  }

  async function facet(
    exclude: string,
    nameTable: string,
    joinTable: string,
    joinCol: string,
  ): Promise<FacetOption[]> {
    const { sql: where, params } = buildWhere(exclude);
    const sql = `
      SELECT t.id::int, t.name, COUNT(DISTINCT s.id)::int AS count
      FROM "${nameTable}" t
      INNER JOIN "${joinTable}" j ON t.id = j.${joinCol}
      INNER JOIN "shiurim" s ON j.shiur_id = s.id
      WHERE ${where}
      GROUP BY t.id, t.name
      ORDER BY t.name
    `;
    const rows = await (prisma.$queryRawUnsafe(sql, ...params) as Promise<Array<{ id: bigint | number; name: string; count: bigint | number }>>);
    return rows.map(r => ({ id: Number(r.id), name: r.name, count: Number(r.count) }));
  }

  const [rabbis, series, parashas, moadim, madorim, categories] = await Promise.all([
    facet("rabbi",    "rabbis",     "shiur_rabbi",    "rabbi_id"),
    facet("series",   "series",     "shiur_series",   "series_id"),
    facet("parasha",  "parashas",   "shiur_parasha",  "parasha_id"),
    facet("moed",     "moadim",     "shiur_moadim",   "moed_id"),
    facet("mador",    "madorim",    "shiur_mador",    "mador_id"),
    facet("category", "categories", "shiur_category", "category_id"),
  ]);

  return { rabbis, series, parashas, moadim, madorim, categories };
}

export async function getShiurBySlug(slug: string) {
  return prisma.shiur.findUnique({
    where: { slug },
    include: {
      rabbis: {
        include: { rabbi: true },
        orderBy: { isPrimary: "desc" },
      },
      series: { include: { series: true } },
      tags: { include: { tag: true }, take: 20 },
      parashas: { include: { parasha: true } },
      moadim: { include: { moed: true } },
      madars: { include: { mador: true } },
      categories: { include: { category: true } },
    },
  });
}

export async function getRelatedShiurim(shiurId: number, rabbiId?: number) {
  return prisma.shiur.findMany({
    where: {
      status: "publish",
      id: { not: shiurId },
      ...(rabbiId && { rabbis: { some: { rabbiId } } }),
    },
    select: {
      id: true, slug: true, title: true,
      vimeoId: true, vimeoThumbnail: true, lessonLength: true,
      rabbis: {
        take: 1, where: { isPrimary: true },
        select: { rabbi: { select: { name: true } } },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 6,
  });
}

export async function getAllRabbis() {
  const rows = await prisma.$queryRaw<Array<{ id: bigint; name: string; slug: string; picture: string | null; count: bigint }>>`
    SELECT r.id, r.name, r.slug, r.picture, COUNT(DISTINCT sr.shiur_id) AS count
    FROM rabbis r
    LEFT JOIN shiur_rabbi sr ON sr.rabbi_id = r.id
    LEFT JOIN shiurim s ON s.id = sr.shiur_id AND s.status = 'publish'
    GROUP BY r.id, r.name, r.slug, r.picture
    HAVING COUNT(DISTINCT sr.shiur_id) > 0
    ORDER BY COUNT(DISTINCT sr.shiur_id) DESC, r.name
  `;
  return rows.map(r => ({ id: Number(r.id), name: r.name, slug: r.slug, picture: r.picture, count: Number(r.count) }));
}

export async function getRabbiBySlug(slug: string) {
  return prisma.rabbi.findUnique({ where: { slug } });
}

export async function getSeriesBySlug(slug: string) {
  // Next.js passes URL params with uppercase hex (%D7%...) but WordPress slugs
  // are stored lowercase (%d7%...). Lowercase normalizes the match.
  return prisma.series.findFirst({
    where: { slug: slug.toLowerCase() },
    include: { parent: true },
  });
}

export async function getSeriesShiurim(seriesId: number) {
  return prisma.shiur.findMany({
    where: { status: "publish", series: { some: { seriesId } } },
    select: {
      id: true, slug: true, title: true,
      vimeoId: true, vimeoThumbnail: true,
      lessonLength: true, hebrewDate: true, publishedAt: true,
      episodeNumber: true,
      rabbis: {
        take: 1,
        orderBy: { isPrimary: "desc" },
        select: { rabbi: { select: { name: true, slug: true } } },
      },
    },
    orderBy: [{ episodeNumber: "asc" }, { publishedAt: "asc" }],
  });
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
