"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/",       label: "שיעורים" },
  { href: "/rabbis", label: "רבנים"  },
];

export default function Header({ total }: { total?: number }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-l from-[#1a1a2e] to-[#0f3460] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold whitespace-nowrap tracking-wide">
            ערוץ מאיר
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  pathname === href
                    ? "bg-white/20 text-white font-medium"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        {total !== undefined && (
          <div className="text-sm text-blue-200">
            <span className="text-white font-bold text-base">{total.toLocaleString("he-IL")}</span>
            {" "}שיעורים
          </div>
        )}
      </div>
    </header>
  );
}
