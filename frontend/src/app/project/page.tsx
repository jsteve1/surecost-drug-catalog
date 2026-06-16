"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { MarkdownDoc } from "@/components/MarkdownDoc";

const GITHUB_URL = "https://github.com/jsteve1/surecost-drug-catalog";

type ProjectTab = "hosting" | "built" | "github";

export default function ProjectPage() {
  const [tab, setTab] = useState<ProjectTab>("hosting");
  const [hostingMd, setHostingMd] = useState("");
  const [builtMd, setBuiltMd] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/docs/PRODUCTION_HOSTING.md").then((r) => {
        if (!r.ok) throw new Error("Failed to load production hosting doc");
        return r.text();
      }),
      fetch("/docs/HOW_THIS_WAS_BUILT.md").then((r) => {
        if (!r.ok) throw new Error("Failed to load how-built doc");
        return r.text();
      }),
    ])
      .then(([hosting, built]) => {
        setHostingMd(hosting);
        setBuiltMd(built);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load docs");
      });
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Project Summary
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Architecture documentation and build journey for this submission.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-700">
          {(
            [
              ["hosting", "Production Hosting"],
              ["built", "How It Was Built"],
              ["github", "GitHub"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium ${
                tab === id
                  ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loadError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40">
            {loadError}
          </p>
        )}

        {tab === "hosting" && hostingMd && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
            <MarkdownDoc content={hostingMd} />
          </div>
        )}

        {tab === "built" && builtMd && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
            <MarkdownDoc content={builtMd} />
          </div>
        )}

        {tab === "github" && (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
            <p className="text-neutral-700 dark:text-neutral-300">
              Source code and commit history for this project:
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex cursor-pointer rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              View on GitHub
            </a>
            <p className="mt-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
              {GITHUB_URL}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
