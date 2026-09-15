"use client";

import { cn } from "@/lib/utils";

/**
 * Renders a failed tool call. The first line becomes the headline, the rest is
 * kept as monospaced detail. Adapted from the AI SDK Elements stack trace.
 */
export function StackTrace({
  error,
  className,
}: {
  error: string;
  className?: string;
}) {
  const [headline, ...frames] = error.trim().split("\n");

  return (
    <div
      className={cn(
        "max-h-48 overflow-auto border border-charcoal bg-beige-muted p-3",
        className,
      )}
    >
      <p className="text-mono-02 text-charcoal" data-preserve-case>
        {headline}
      </p>

      {frames.length > 0 && (
        <pre className="text-mono-02 mt-2 overflow-x-auto whitespace-pre-wrap text-grey-light-11">
          {frames.join("\n")}
        </pre>
      )}
    </div>
  );
}
