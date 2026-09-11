"use client";

import type { ChatStatus } from "ai";
import { ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CodeBlock } from "@/components/ai-elements/code-block";
import { StackTrace } from "@/components/ai-elements/stack-trace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import type { AgentUIMessage } from "@/lib/types";

type ToolPart = Extract<
  AgentUIMessage["parts"][number],
  { type: "tool-playwright_execute" }
>;

type Step = {
  id: string;
  index: number;
  state: "writing" | "running" | "done" | "failed" | "cancelled";
  code?: string;
  durationMs?: number;
  result?: unknown;
  error?: string;
};

type RunEntry = { kind: "step"; step: Step } | { kind: "note"; text: string };

type Run = {
  id: string;
  task: string;
  entries: RunEntry[];
};

const EXAMPLES = [
  "go to news.ycombinator.com and return the first article title",
  "open example.com and return the h1",
  "search wikipedia for chromium and return the first paragraph",
];

function toStep(part: ToolPart, index: number, interrupted: boolean): Step {
  const code = part.input?.code;

  switch (part.state) {
    case "input-streaming":
      return {
        id: part.toolCallId,
        index,
        state: interrupted ? "cancelled" : "writing",
        code,
      };
    case "input-available":
      return {
        id: part.toolCallId,
        index,
        state: interrupted ? "cancelled" : "running",
        code: part.input.code,
      };
    case "output-available":
      return {
        id: part.toolCallId,
        index,
        state: part.output.success ? "done" : "failed",
        code: part.input.code,
        durationMs: part.output.durationMs,
        result: part.output.result,
        error: part.output.error,
      };
    case "output-error":
      return {
        id: part.toolCallId,
        index,
        state: "failed",
        code,
        error: part.errorText,
      };
    default:
      return { id: part.toolCallId, index, state: "failed", code };
  }
}

type PendingEntry = { kind: "step"; part: ToolPart } | { kind: "note"; text: string };

type PendingRun = {
  id: string;
  task: string;
  entries: PendingEntry[];
};

function toRuns(messages: AgentUIMessage[], busy: boolean): Run[] {
  const pending: PendingRun[] = [];

  for (const message of messages) {
    if (message.role === "user") {
      pending.push({
        id: message.id,
        task: message.parts
          .map((part) => (part.type === "text" ? part.text : ""))
          .join(""),
        entries: [],
      });
      continue;
    }

    const run = pending.at(-1);
    if (!run) continue;

    for (const part of message.parts) {
      if (part.type === "tool-playwright_execute") {
        run.entries.push({ kind: "step", part });
      } else if (part.type === "text" && part.text.trim()) {
        run.entries.push({ kind: "note", text: part.text.trim() });
      }
    }
  }

  return pending.map((run, index) => {
    // only the newest run can still be in flight, so anything unfinished in an
    // earlier one was interrupted
    const interrupted = !busy || index < pending.length - 1;
    let stepIndex = 0;

    return {
      id: run.id,
      task: run.task,
      entries: run.entries.map((entry) =>
        entry.kind === "step"
          ? { kind: "step" as const, step: toStep(entry.part, ++stepIndex, interrupted) }
          : entry,
      ),
    };
  });
}

function formatResult(result: unknown) {
  if (result === undefined || result === null) return null;
  if (typeof result === "string") return result;
  return JSON.stringify(result, null, 2);
}

export function AgentStepsSidebar({
  messages,
  status,
  error,
  onSend,
  onStop,
}: {
  messages: AgentUIMessage[];
  status: ChatStatus;
  error: Error | undefined;
  onSend: (task: string) => void;
  onStop: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollArea = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const runs = useMemo(() => toRuns(messages, busy), [messages, busy]);
  const stepCount = runs.reduce(
    (total, run) => total + run.entries.filter((entry) => entry.kind === "step").length,
    0,
  );
  const lastRun = runs.at(-1);
  const waiting = busy && (!lastRun || lastRun.entries.length === 0);

  // follow the stream, but leave the scroll position alone if the reader moved away
  useEffect(() => {
    const element = scrollArea.current;
    if (!element) return;

    const nearBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 120;
    if (nearBottom) element.scrollTop = element.scrollHeight;
  }, [messages, status]);

  const submit = (task: string) => {
    const trimmed = task.trim();
    if (!trimmed || busy) return;

    setDraft("");
    onSend(trimmed);
  };

  return (
    <aside className="flex w-full flex-col border border-grey-light-07 bg-beige lg:h-full lg:min-h-0 lg:w-[420px] lg:shrink-0 xl:w-[480px]">
      <header className="flex items-center justify-between gap-2 border-b border-grey-light-07 px-4 py-3">
        <h2 className="text-label-02 text-charcoal">agent steps</h2>
        <Badge>{stepCount} {stepCount === 1 ? "step" : "steps"}</Badge>
      </header>

      <div ref={scrollArea} className="min-h-0 flex-1 overflow-y-auto">
        {runs.length === 0 ? (
          <div className="space-y-4 p-4">
            <p className="text-body-03 text-grey-light-11">
              describe a task. the agent writes playwright, runs it in the
              browser, and every step lands here.
            </p>
            <div className="flex flex-col items-start gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => submit(example)}
                  disabled={busy}
                  className="border border-grey-light-07 bg-beige-light px-3 py-2 text-left text-body-03 text-charcoal transition-colors hover:border-charcoal disabled:opacity-32"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="divide-y divide-grey-light-07">
            {runs.map((run) => (
              <li key={run.id} className="space-y-3 p-4">
                <p
                  className="text-body-02 text-charcoal"
                  data-preserve-case
                >
                  {run.task}
                </p>

                {run.entries.map((entry, index) =>
                  entry.kind === "step" ? (
                    <StepCard key={entry.step.id} step={entry.step} />
                  ) : (
                    <p
                      key={index}
                      className="border-l-2 border-kernel-green pl-3 text-body-03 text-grey-light-11"
                      data-preserve-case
                    >
                      {entry.text}
                    </p>
                  ),
                )}
              </li>
            ))}
          </ol>
        )}

        {waiting && (
          <p className="flex items-center gap-2 px-4 pb-4 text-body-03 text-grey-light-11">
            <Loader2 size={14} className="animate-spin text-kernel-green" />
            thinking
          </p>
        )}

        {error && (
          <div className="p-4">
            <StackTrace error={error.message} />
          </div>
        )}
      </div>

      <form
        className="border-t border-grey-light-07 bg-beige-light p-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              submit(draft);
            }
          }}
          placeholder="what should the browser do next"
          disabled={busy}
          className="min-h-20"
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-tag text-grey-light-11">cmd/ctrl + enter</span>
          <div className="flex items-center gap-2">
            {busy && (
              <Button variant="outline" size="sm" type="button" onClick={onStop}>
                stop
              </Button>
            )}
            <Button type="submit" size="sm" disabled={!draft.trim() || busy}>
              {busy ? "running" : "run"}
            </Button>
          </div>
        </div>
      </form>
    </aside>
  );
}

function StepCard({ step }: { step: Step }) {
  const result = formatResult(step.result);

  return (
    <article className="border border-grey-light-07 bg-beige-light">
      <header className="flex items-center justify-between gap-2 border-b border-grey-light-07 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-mono-02 text-grey-light-11">
            {String(step.index).padStart(2, "0")}
          </span>
          <span className="text-mono-02 text-charcoal">
            playwright_execute
          </span>
        </div>
        <StepStatus step={step} />
      </header>

      <div className="space-y-3 p-3">
        {step.code ? (
          <CodeBlock code={step.code} label="generated playwright" />
        ) : (
          <p className="text-mono-02 text-grey-light-11">waiting for code</p>
        )}

        {step.error && <StackTrace error={step.error} />}

        {result && (
          <Collapsible>
            <CollapsibleTrigger className="group flex w-full items-center gap-2 text-mono-02 text-grey-light-11 transition-colors hover:text-charcoal">
              <ChevronRight
                size={14}
                className="transition-transform group-data-[state=open]:rotate-90"
              />
              returned value
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <pre
                className="max-h-64 overflow-auto border border-grey-light-07 bg-beige p-3 text-mono-02 whitespace-pre-wrap text-charcoal"
                data-preserve-case
              >
                {result}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </article>
  );
}

function StepStatus({ step }: { step: Step }) {
  if (step.state === "writing" || step.state === "running") {
    return (
      <span className="flex items-center gap-2 text-tag text-grey-light-11">
        <Loader2 size={12} className="animate-spin text-kernel-green" />
        {step.state === "writing" ? "writing code" : "running in browser"}
      </span>
    );
  }

  if (step.state === "failed") {
    return <span className="text-tag text-charcoal">failed</span>;
  }

  if (step.state === "cancelled") {
    return <span className="text-tag text-grey-light-11">cancelled</span>;
  }

  return (
    <span className="text-tag text-grey-light-11">
      {step.durationMs === undefined
        ? "done"
        : `${step.durationMs}ms in browser`}
    </span>
  );
}
