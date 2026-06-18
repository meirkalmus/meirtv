"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface Option { id: number; name: string; count?: number; }

interface SearchFiltersProps {
  rabbis: Option[];
  series: Option[];
  parashas: Option[];
  moadim: Option[];
  madorim: Option[];
  categories: Option[];
  total: number;
}

function Select({
  name, label, options, value, onChange,
}: {
  name: string; label: string; options: Option[];
  value: string; onChange: (name: string, val: string) => void;
}) {
  const selected = options.find(o => String(o.id) === value);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium flex items-center justify-between">
        <span>{label}</span>
        {selected?.count !== undefined && (
          <span className="text-blue-600 font-semibold text-xs">{selected.count.toLocaleString()}</span>
        )}
      </label>
      <select
        value={value}
        onChange={e => onChange(name, e.target.value)}
        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "left 12px center",
        }}
      >
        <option value="">הכל</option>
        {options.map(o => (
          <option key={o.id} value={String(o.id)}>
            {o.name}{o.count !== undefined ? ` (${o.count.toLocaleString()})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SearchFilters(props: SearchFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const get = (key: string) => params.get(key) || "";

  const update = useCallback((name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) { next.set(name, value); } else { next.delete(name); }
    next.delete("page");
    startTransition(() => { router.push(`/?${next.toString()}`); });
  }, [params, router]);

  const hasFilters = ["q", "rabbiId", "seriesId", "tagId", "parashaId", "moedId", "madorId", "categoryId"].some(k => params.has(k));

  return (
    <div className={`transition-opacity duration-150 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Search bar */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="חיפוש שיעורים..."
          defaultValue={get("q")}
          onKeyDown={e => { if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value); }}
          onBlur={e => { if (e.target.value !== get("q")) update("q", e.target.value); }}
          className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm pr-12"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
      </div>

      {/* Filter grid */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Select name="rabbiId"    label="רב"       options={props.rabbis}     value={get("rabbiId")}    onChange={update} />
          <Select name="seriesId"   label="סדרה"     options={props.series}     value={get("seriesId")}   onChange={update} />
          <Select name="parashaId"  label="פרשה"     options={props.parashas}   value={get("parashaId")}  onChange={update} />
          <Select name="moedId"     label="מועד"     options={props.moadim}     value={get("moedId")}     onChange={update} />
          <Select name="madorId"    label="מדור"     options={props.madorim}    value={get("madorId")}    onChange={update} />
          <Select name="categoryId" label="קטגוריה"  options={props.categories} value={get("categoryId")} onChange={update} />
        </div>

        {hasFilters && (
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm text-gray-500">
              נמצאו <strong className="text-gray-800">{props.total.toLocaleString("he-IL")}</strong> שיעורים
            </span>
            <button
              onClick={() => { startTransition(() => router.push("/")); }}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              נקה סינון
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
