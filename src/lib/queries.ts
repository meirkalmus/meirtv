import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

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
          where: { isPrimary: true },
          select: { rabbi: { select: { name: true, slug: true } } },
        },
        series: {
          take: 1,
          select: { series: { select: { name: true, slug: true } } },
        },
      },
      orderBy: [{ publishedAt: "desc" }],
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

export async function getFilterOptions() {
  const [rabbis, series, parashas, moadim, madorim, categories] =
    await Promise.all([
      prisma.rabbi.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.series.findMany({
        where: { parentId: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
        take: 500,
      }),
      prisma.parasha.findMany({
        where: { parentId: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.moed.findMany({
        where: { parentId: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.mador.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        where: { parentId: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
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

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
