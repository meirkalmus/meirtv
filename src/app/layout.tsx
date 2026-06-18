import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ערוץ מאיר - אתר היהדות הגדול בעולם",
    template: "%s | ערוץ מאיר",
  },
  description: "אלפי שיעורי תורה בווידאו ואודיו מהרבנים המובילים בישראל",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://meirtv.com"),
  openGraph: {
    siteName: "ערוץ מאיר",
    locale: "he_IL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
