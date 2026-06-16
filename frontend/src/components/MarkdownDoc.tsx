"use client";

import { useEffect, useId, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";

interface MarkdownDocProps {
  content: string;
}

function MermaidBlock({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    mermaid
      .initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains("dark")
          ? "dark"
          : "default",
        securityLevel: "loose",
      });
    mermaid
      .render(`mermaid-${id}`, chart)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => {
        if (ref.current) {
          ref.current.textContent = chart;
        }
      });
  }, [chart, id]);

  return <div ref={ref} className="my-4 overflow-x-auto" />;
}

export function MarkdownDoc({ content }: MarkdownDocProps) {
  return (
    <article className="markdown-doc max-w-none text-neutral-800 dark:text-neutral-200 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-emerald-600 [&_a]:underline dark:[&_a]:text-emerald-400 [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_code]:text-sm dark:[&_code]:bg-neutral-800 [&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-neutral-100 [&_pre]:p-4 dark:[&_pre]:bg-neutral-900 [&_table]:mb-4 [&_table]:w-full [&_th]:border [&_th]:border-neutral-300 [&_th]:bg-neutral-50 [&_th]:p-2 [&_td]:border [&_td]:border-neutral-300 [&_td]:p-2 dark:[&_th]:border-neutral-600 dark:[&_th]:bg-neutral-800 dark:[&_td]:border-neutral-600">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? "");
            const lang = match?.[1];
            const text = String(children).replace(/\n$/, "");
            if (lang === "mermaid") {
              return <MermaidBlock chart={text} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
