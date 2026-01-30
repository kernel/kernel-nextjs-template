"use client";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { isValidElement } from "react";
import { CodeBlock } from "./code-block";

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible className={cn("rounded-lg border bg-card", className)} {...props} />
);

export type ToolPart = ToolUIPart | DynamicToolUIPart;

export type ToolHeaderProps = {
  title?: string;
  className?: string;
} & (
  | { type: ToolUIPart["type"]; state: ToolUIPart["state"]; toolName?: never }
  | {
      type: DynamicToolUIPart["type"];
      state: DynamicToolUIPart["state"];
      toolName: string;
    }
);

export const getStatusBadge = (status: ToolPart["state"]) => {
  const labels: Record<ToolPart["state"], string> = {
    "input-streaming": "Pending",
    "input-available": "Running",
    "approval-requested": "Awaiting Approval",
    "approval-responded": "Responded",
    "output-available": "Completed",
    "output-error": "Error",
    "output-denied": "Denied",
  };

  const icons: Record<ToolPart["state"], ReactNode> = {
    "input-streaming": <ClockIcon className="size-3" />,
    "input-available": <CircleIcon className="size-3 animate-pulse" />,
    "approval-requested": <ClockIcon className="size-3" />,
    "approval-responded": <CheckCircleIcon className="size-3" />,
    "output-available": <CheckCircleIcon className="size-3" />,
    "output-error": <XCircleIcon className="size-3" />,
    "output-denied": <XCircleIcon className="size-3" />,
  };

  return (
    <Badge
      className={cn(
        "ml-2 gap-1 font-normal",
        status === "output-error" && "bg-destructive text-destructive-foreground",
        status === "output-denied" && "bg-destructive text-destructive-foreground"
      )}
      variant="secondary"
    >
      {icons[status]}
      {labels[status]}
    </Badge>
  );
};

export const ToolHeader = ({
  className,
  title,
  type,
  state,
  toolName,
  ...props
}: ToolHeaderProps & ComponentProps<typeof CollapsibleTrigger>) => {
  const derivedName =
    type === "dynamic-tool" ? toolName : type.split("-").slice(1).join("-");

  return (
    <CollapsibleTrigger
      className={cn(
        "flex w-full items-center justify-between p-3 text-sm font-medium hover:bg-muted/50",
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2">
        <WrenchIcon className="size-4 text-muted-foreground" />
        {title ?? derivedName}
        {getStatusBadge(state)}
      </span>
      <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  );
};

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn("space-y-4 border-t bg-muted/30 p-3", className)}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolPart["input"];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div className={cn("space-y-2", className)} {...props}>
    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      Parameters
    </h4>
    <CodeBlock
      code={JSON.stringify(input, null, 2)}
      language="json"
      className="text-xs"
    />
  </div>
);

export type ToolOutputProps = ComponentProps<"div"> & {
  output?: ReactNode;
  errorText?: string | null;
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  let Output = <div>{output as ReactNode}</div>;

  if (typeof output === "object" && !isValidElement(output)) {
    Output = (
      <CodeBlock
        code={JSON.stringify(output, null, 2)}
        language="json"
        className="text-xs"
      />
    );
  } else if (typeof output === "string") {
    Output = <CodeBlock code={output} language="text" className="text-xs" />;
  }

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {errorText ? "Error" : "Result"}
      </h4>
      <div className="rounded-md">
        {errorText && <p className="text-sm text-destructive">{errorText}</p>}
        {Output}
      </div>
    </div>
  );
};
