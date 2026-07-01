import { getAllRabbis } from "@/lib/queries";
import Header from "@/components/Header";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "רבנים | ערוץ מאיר",
  description: "כל הרבנים והמרצים בערוץ מאיר",
};

export const revalidate = 3600;

export default async function RabbisPage() {
  const rabbis = await getAllRabbis();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">רבנים ומרצים</h1>
        <p className="text-gray-500 text-sm mb-8">{rabbis.length.toLocaleString("he-IL")} רבנים</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {rabbis.map(rabbi => (
            <Link
              key={rabbi.id}
              href={`/rabbi/${rabbi.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col items-center p-4 gap-3 text-center"
            >
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                {rabbi.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={rabbi.picture} alt={rabbi.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-blue-600">
                    {rabbi.name.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5 min-w-0 w-full">
                <p className="font-medium text-gray-900 text-sm leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                  {rabbi.name}
                </p>
                <p className="text-xs text-gray-400">
                  {rabbi.count.toLocaleString("he-IL")} שיעורים
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
