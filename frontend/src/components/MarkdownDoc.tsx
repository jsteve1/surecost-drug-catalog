"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";

interface MarkdownDocProps {
  content: string;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function MermaidLightbox({
  svg,
  isDark,
  onClose,
}: {
  svg: string;
  isDark: boolean;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(4);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);

  const zoomBy = useCallback((factor: number) => {
    setScale((s) => clampScale(s * factor));
  }, []);

  const reset = useCallback(() => {
    setScale(4);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomBy(1.2);
      else if (e.key === "-" || e.key === "_") zoomBy(1 / 1.2);
      else if (e.key === "0") reset();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, zoomBy, reset]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.x),
      y: drag.current.oy + (e.clientY - drag.current.y),
    });
  };

  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const controlClass =
    "flex h-9 min-w-9 items-center justify-center rounded-md bg-white/15 px-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/30";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Diagram viewer"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-end gap-2 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.2)}
          aria-label="Zoom out"
          className={controlClass}
        >
          &minus;
        </button>
        <span className="min-w-14 text-center text-sm tabular-nums text-white/80">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(1.2)}
          aria-label="Zoom in"
          className={controlClass}
        >
          +
        </button>
        <button type="button" onClick={reset} className={controlClass}>
          Reset
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={controlClass}
        >
          Close &#10005;
        </button>
      </div>

      <div
        className="relative flex-1 touch-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        >
          <div
            className={`rounded-lg p-4 shadow-2xl ${
              isDark ? "bg-neutral-900" : "bg-white"
            } [&>svg]:!h-auto [&>svg]:!max-w-[82vw]`}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>

      <p
        className="pb-3 text-center text-xs text-white/70"
        onClick={(e) => e.stopPropagation()}
      >
        Scroll to zoom &middot; drag to pan &middot; Esc to close
      </p>
    </div>,
    document.body,
  );
}

function MermaidBlock({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "");
  const [render, setRender] = useState<{
    svg: string;
    isDark: boolean;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const dark = document.documentElement.classList.contains("dark");
    mermaid.initialize({
      startOnLoad: false,
      theme: dark ? "dark" : "default",
      securityLevel: "loose",
      suppressErrorRendering: true,
    });
    mermaid
      .render(`mermaid-${id}`, chart)
      .then(({ svg }) => {
        if (!cancelled) setRender({ svg, isDark: dark });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (failed) {
    return (
      <pre className="my-4 overflow-x-auto rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        {chart}
      </pre>
    );
  }

  if (!render) {
    return (
      <div className="my-4 h-28 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
    );
  }

  return (
    <>
      <figure className="group relative my-4">
        <div
          role="button"
          tabIndex={0}
          aria-label="Enlarge diagram"
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className="cursor-zoom-in overflow-x-auto rounded-lg border border-transparent p-2 transition group-hover:border-neutral-200 group-hover:bg-neutral-50 dark:group-hover:border-neutral-700 dark:group-hover:bg-neutral-800/40 [&>svg]:!h-auto [&>svg]:!w-full [&>svg]:!max-w-full"
          dangerouslySetInnerHTML={{ __html: render.svg }}
        />
        <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-neutral-900/75 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
          Click to enlarge
        </span>
      </figure>
      {open && (
        <MermaidLightbox
          svg={render.svg}
          isDark={render.isDark}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
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
