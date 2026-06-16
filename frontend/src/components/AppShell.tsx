"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

const navLink =
  "rounded-md px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <Link href="/drugs" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              SureCost Drug Catalog
            </Link>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Pharmacy inventory search and management
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/drugs" className={navLink}>
              Drugs
            </Link>
            <Link href="/audit" className={navLink}>
              Audit
            </Link>
            <Link href="/demo" className={navLink}>
              API Demo
            </Link>
            <Link href="/project" className={navLink}>
              Project Summary
            </Link>
            <Link
              href="/drugs/new"
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 cursor-pointer"
            >
              Add Drug
            </Link>
            <button
              type="button"
              onClick={toggle}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-md p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
