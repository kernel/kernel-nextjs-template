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
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getHighlighter()
      .then((highlighter) =>
        highlighter.codeToHtml(code, { lang: "javascript", theme: "kernel" }),
      )
      .then((result) => {
        if (!cancelled) setHtml(result);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "copied" : "copy"}
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
