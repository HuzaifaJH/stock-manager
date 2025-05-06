import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutProvider from "@/components/layout";
import ThemeSetup from "@/app/utils/themeSetup";
import { syncDatabase } from "@/lib/sync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stock Manager | Track Stock, Manage Sales, Grow Faster.",
  description: "Track Stock, Manage Sales, Grow Faster.",
  applicationName: "Stock Manager",
  authors: [{ name: "Huzaifa Juzer", url: "https://github.com/HuzaifaJH" }],
  // creator: "Huzaifa Juzer",
  keywords: ["Stock Manager", "Inventory System", "Sales Management"],
  other: { copyright: `© ${new Date().getFullYear()} Huzaifa Juzer. All Rights Reserved.` }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await syncDatabase(); // Sync DB before rendering the app
  return (
    <html lang="en" data-theme="winter" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen`}
      >
        <ThemeSetup />
        <LayoutProvider>{children}</LayoutProvider>
      </body>
    </html>
  );
}
