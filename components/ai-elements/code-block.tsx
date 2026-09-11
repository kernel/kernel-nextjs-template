"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { getHighlighter } from "@/lib/shiki";
import { cn } from "@/lib/utils";

/**
 * Syntax-highlighted code on the charcoal surface. Adapted from the AI SDK
 * Elements code block and restyled to the KERNEL design system.
 */
export function CodeBlock({
  code,
  label = "playwright",
  className,
  streaming = false,
}: {
  code: string;
  label?: string;
  className?: string;
  /** while true, skip highlighting - the plain <pre> fallback already reads fine */
  streaming?: boolean;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (streaming) return;

    let cancelled = false;

    getHighlighter()
      .then((highlighter) =>
        highlighter.codeToHtml(code, { lang: "javascript", theme: "kernel" }),
      )
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        // leave html null - the plain <pre> fallback below already covers this
      });

    return () => {
      cancelled = true;
    };
  }, [code, streaming]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    } finally {
      setTimeout(() => setCopyState("idle"), 1500);
    }
  };

  return (
    <div className={cn("border border-grey-dark-12/32 bg-charcoal", className)}>
      <div className="flex items-center justify-between border-b border-grey-dark-12/32 px-3 py-2">
        <span className="text-tag text-grey-dark-12/64">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 text-tag text-grey-dark-12/64 transition-colors hover:text-grey-dark-12"
        >
          {copyState === "copied" ? <Check size={12} /> : <Copy size={12} />}
          {copyState === "copied"
            ? "copied"
            : copyState === "failed"
              ? "copy failed"
              : "copy"}
        </button>
      </div>

      <div className="code-surface max-h-72 overflow-auto">
        {html ? (
          <div
            className="text-mono-02 p-3"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="text-mono-02 p-3 text-grey-dark-12">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
