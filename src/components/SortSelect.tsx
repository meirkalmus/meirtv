"use client";

const SORT_OPTIONS = [
  { value: "publishedAt_desc",  label: "מהחדש לישן" },
  { value: "publishedAt_asc",   label: "מהישן לחדש" },
  { value: "lessonLength_asc",  label: "הקצר ביותר" },
  { value: "lessonLength_desc", label: "הארוך ביותר" },
];

export default function SortSelect({ value }: { value: string }) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = new URL(window.location.href);
    url.searchParams.set("sort", e.target.value);
    url.searchParams.delete("page");
    window.location.href = url.toString();
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
    >
      {SORT_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
