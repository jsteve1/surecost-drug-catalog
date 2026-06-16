"use client";

import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <Link href="/drugs" className="text-lg font-semibold text-slate-900">
              SureCost Drug Catalog
            </Link>
            <p className="text-sm text-slate-500">
              Pharmacy inventory search and management
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/drugs"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Drugs
            </Link>
            <Link
              href="/drugs/new"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Drug
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
