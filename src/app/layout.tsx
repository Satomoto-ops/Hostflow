import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HostFlow | Property & Transient Rental Management SaaS",
  description:
    "End-to-end condo rental management: multi-channel occupancy tracking, housekeeping dispatcher, and guest utility calculators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
