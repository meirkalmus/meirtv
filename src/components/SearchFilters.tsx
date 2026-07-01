"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

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

const SORT_OPTIONS = [
  { value: "publishedAt_desc",  label: "מהחדש לישן" },
  { value: "publishedAt_asc",   label: "מהישן לחדש" },
  { value: "lessonLength_asc",  label: "הקצר ביותר" },
  { value: "lessonLength_desc", label: "הארוך ביותר" },
];

// ─── Searchable combobox dropdown ────────────────────────────────────────────
function ComboSelect({
  name, label, options, value, onChange,
}: {
  name: string; label: string; options: Option[];
  value: string; onChange: (name: string, val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => String(o.id) === value) ?? null;
  const filtered = search
    ? options.filter(o => o.name.includes(search) || o.name.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) { setOpen(false); setSearch(""); }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setSearch(""); }
    };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onMouse); document.removeEventListener("keydown", onKey); };
  }, []);

  const choose = (val: string) => { onChange(name, val); setOpen(false); setSearch(""); };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-1 bg-white rounded-xl px-3 py-2.5 text-sm text-right border transition-all
          ${selected ? "border-blue-400 text-gray-900 font-medium" : "border-gray-200 text-gray-500"}
          ${open ? "ring-2 ring-blue-500 border-blue-400" : "hover:border-gray-300"}`}
      >
        <span className="flex-1 truncate text-right leading-snug">
          {selected ? selected.name : "הכל"}
        </span>
        {selected && selected.count !== undefined && (
          <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
            {selected.count.toLocaleString()}
          </span>
        )}
        <svg className={`flex-shrink-0 w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="חיפוש..."
                className="w-full text-sm pr-3 pl-8 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto overscroll-contain">
            <button type="button" onClick={() => choose("")}
              className={`w-full text-right px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors
                ${!value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600"}`}>
              <span>הכל</span>
            </button>
            {filtered.length === 0 && (
              <div className="px-3 py-5 text-sm text-gray-400 text-center">לא נמצאו תוצאות</div>
            )}
            {filtered.map(o => (
              <button key={o.id} type="button" onClick={() => choose(String(o.id))}
                className={`w-full text-right px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors
                  ${String(o.id) === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}>
                <span className="truncate flex-1">{o.name}</span>
                {o.count !== undefined && (
                  <span className={`flex-shrink-0 mr-2 text-xs ${String(o.id) === value ? "text-blue-500" : "text-gray-400"}`}>
                    {o.count.toLocaleString()}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Active filter chips ──────────────────────────────────────────────────────
const FILTER_DEFS = [
  { param: "rabbiId",    label: "רב" },
  { param: "seriesId",   label: "סדרה" },
  { param: "parashaId",  label: "פרשה" },
  { param: "moedId",     label: "מועד" },
  { param: "madorId",    label: "מדור" },
  { param: "categoryId", label: "קטגוריה" },
  { param: "q",          label: "חיפוש" },
] as const;

function ActiveFilters({
  props, params, onRemove, onClearAll,
}: {
  props: SearchFiltersProps;
  params: URLSearchParams;
  onRemove: (param: string) => void;
  onClearAll: () => void;
}) {
  const optionMap: Record<string, Option[]> = {
    rabbiId: props.rabbis, seriesId: props.series,
    parashaId: props.parashas, moedId: props.moadim,
    madorId: props.madorim, categoryId: props.categories,
  };
  const active = FILTER_DEFS.filter(f => params.has(f.param));
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
      <span className="text-xs text-gray-400 font-medium">פעיל:</span>
      {active.map(({ param, label }) => {
        const rawVal = params.get(param) || "";
        const optList = optionMap[param];
        const displayName = optList
          ? (optList.find(o => String(o.id) === rawVal)?.name ?? rawVal)
          : `"${rawVal}"`;
        return (
          <button key={param} type="button" onClick={() => onRemove(param)}
            className="group flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-red-50 hover:text-red-600 border border-blue-200 hover:border-red-200 rounded-full px-3 py-1 text-xs font-medium transition-all">
            <span>{label}: {displayName}</span>
            <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        );
      })}
      {active.length > 1 && (
        <button type="button" onClick={onClearAll}
          className="text-xs text-gray-400 hover:text-red-600 underline underline-offset-2 transition-colors pr-1">
          נקה הכל
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SearchFilters(props: SearchFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const get = (key: string) => params.get(key) || "";

  const update = useCallback((name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) { next.set(name, value); } else { next.delete(name); }
    next.delete("page");
    startTransition(() => { router.push(`/?${next.toString()}`); });
  }, [params, router]);

  const removeFilter = useCallback((param: string) => update(param, ""), [update]);
  const clearAll = useCallback(() => startTransition(() => router.push("/")), [router]);

  // Controlled search input with debounce
  const [searchValue, setSearchValue] = useState(get("q"));

  // Reset input when URL q param changes externally (e.g. clear all)
  const qFromUrl = get("q");
  useEffect(() => { setSearchValue(qFromUrl); }, [qFromUrl]);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update("q", val), 400);
  };

  const currentSort = get("sort") || "publishedAt_desc";

  return (
    <div className={`transition-opacity duration-150 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Search bar */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="חיפוש שיעורים, רבנים, סדרות..."
          value={searchValue}
          onChange={e => handleSearchChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              clearTimeout(debounceRef.current);
              update("q", searchValue);
            }
          }}
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
          <ComboSelect name="rabbiId"    label="רב"       options={props.rabbis}     value={get("rabbiId")}    onChange={update} />
          <ComboSelect name="seriesId"   label="סדרה"     options={props.series}     value={get("seriesId")}   onChange={update} />
          <ComboSelect name="parashaId"  label="פרשה"     options={props.parashas}   value={get("parashaId")}  onChange={update} />
          <ComboSelect name="moedId"     label="מועד"     options={props.moadim}     value={get("moedId")}     onChange={update} />
          <ComboSelect name="madorId"    label="מדור"     options={props.madorim}    value={get("madorId")}    onChange={update} />
          <ComboSelect name="categoryId" label="קטגוריה"  options={props.categories} value={get("categoryId")} onChange={update} />
        </div>
        <ActiveFilters props={props} params={params} onRemove={removeFilter} onClearAll={clearAll} />
      </div>

      {/* Results count + sort */}
      <div className="mt-4 mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          {props.total.toLocaleString("he-IL")}{" "}
          {params.has("q") || params.has("rabbiId") || params.has("seriesId") || params.has("parashaId") || params.has("moedId") || params.has("madorId") || params.has("categoryId")
            ? "תוצאות" : "שיעורים"}
        </p>
        <select
          value={currentSort}
          onChange={e => update("sort", e.target.value === "publishedAt_desc" ? "" : e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
