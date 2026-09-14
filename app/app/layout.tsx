import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "First 90 — Onboarding Accelerator",
  description:
    "STARS situation diagnosis, a generated 30/60/90 plan, and a stakeholder & coalition map for your first 90 days.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3 text-sm font-medium">
            <Link href="/" className="font-semibold text-slate-900">
              First 90
            </Link>
            <Link href="/diagnosis" className="text-slate-600 hover:text-slate-900">
              Diagnosis
            </Link>
            <Link href="/plan" className="text-slate-600 hover:text-slate-900">
              Plan
            </Link>
            <Link href="/stakeholders" className="text-slate-600 hover:text-slate-900">
              Stakeholders
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
