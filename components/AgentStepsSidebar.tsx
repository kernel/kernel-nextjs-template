"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockFilename,
  CodeBlockActions,
  CodeBlockCopyButton,
} from "@/components/ai-elements/code-block";
import {
  StackTrace,
  StackTraceHeader,
  StackTraceError,
  StackTraceErrorType,
  StackTraceErrorMessage,
  StackTraceActions,
  StackTraceCopyButton,
  StackTraceExpandButton,
  StackTraceContent,
  StackTraceFrames,
} from "@/components/ai-elements/stack-trace";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  CheckCircle2,
  XCircle,
  Terminal,
  MessageSquare,
  Loader2,
  Code2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { useEffect, useRef } from "react";

interface StepContentItem {
  type: "tool-call" | "tool-result" | "text";
  toolCallId?: string;
  toolName?: string;
  code?: string;
  result?: any;
  success?: boolean;
  error?: string;
  text?: string;
}

interface DetailedStep {
  stepNumber: number;
  finishReason: string | null;
  content: StepContentItem[];
}

interface AgentStepsSidebarProps {
  steps: DetailedStep[];
  isRunning: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  task?: string;
}

export function AgentStepsSidebar({
  steps,
  isRunning,
  isCollapsed,
  onToggleCollapse,
  task,
}: AgentStepsSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new steps are added
  useEffect(() => {
    if (scrollRef.current && steps.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-4 bg-[#0A0A0A] border-l border-white/10 w-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-white"
        >
          <PanelRightOpen className="w-5 h-5" />
        </Button>
        {isRunning && (
          <div className="mt-4">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          </div>
        )}
        {steps.length > 0 && (
          <Badge variant="secondary" className="mt-4 px-2 py-1 text-xs">
            {steps.length}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#0A0A0A] border-l border-white/10 w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-white text-sm">Agent Steps</span>
          {steps.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {steps.length} step{steps.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-white h-8 w-8"
        >
          <PanelRightClose className="w-4 h-4" />
        </Button>
      </div>

      {/* Task Description */}
      {task && (
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <p className="text-xs text-gray-400 mb-1">Current Task</p>
          <p className="text-sm text-gray-200">{task}</p>
        </div>
      )}

      {/* Steps Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {steps.length === 0 && !isRunning && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Terminal className="w-12 h-12 text-gray-700 mb-4" />
            <p className="text-gray-500 text-sm">
              Agent steps will appear here
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Run a task to see the execution
            </p>
          </div>
        )}

        {steps.map((step, index) => (
          <StepCard
            key={`step-${step.stepNumber}`}
            step={step}
            isLast={index === steps.length - 1}
          />
        ))}

        {/* Loading indicator for running state */}
        {isRunning && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span className="text-sm text-purple-300">
              Agent is thinking...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StepCard({ step, isLast }: { step: DetailedStep; isLast: boolean }) {
  // Extract different content types
  const toolCalls = step.content.filter((item) => item.type === "tool-call");
  const toolResults = step.content.filter((item) => item.type === "tool-result");
  const textItems = step.content.filter((item) => item.type === "text");

  const hasToolCalls = toolCalls.length > 0;
  const hasText = textItems.length > 0;

  // Determine overall step status
  const allSuccessful =
    toolResults.length === 0 ||
    toolResults.every((r) => r.success !== false);

  // Group tool calls with their matching results
  const toolExecutions = toolCalls.map((tc) => {
    const matchingResult = toolResults.find(
      (tr) => tr.toolCallId === tc.toolCallId
    );
    return {
      toolCall: tc,
      toolResult: matchingResult,
    };
  });

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-px bg-white/10" />
      )}

      <div className="flex gap-3">
        {/* Step number circle */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            allSuccessful
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {step.stepNumber}
        </div>

        {/* Step content */}
        <div className="flex-1 space-y-3 pb-4 min-w-0">
          {/* Tool executions using AI SDK Tool component */}
          {toolExecutions.map((execution, execIndex) => {
            const hasError = execution.toolResult?.error;
            const toolState = hasError ? "output-error" : "output-available";
            const toolName = execution.toolCall.toolName || "playwright_execute";

            return (
              <Tool
                key={`exec-${execIndex}`}
                defaultOpen={true}
                className="bg-[#111] border-white/10"
              >
                <ToolHeader
                  type={`tool-${toolName}` as any}
                  state={toolState}
                  title={toolName}
                  className="text-gray-200 hover:bg-white/5"
                />
                <ToolContent className="space-y-3 bg-transparent">
                  {/* Generated Code Section using AI Elements CodeBlock */}
                  {execution.toolCall.code && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Generated Code
                      </h4>
                      <CodeBlock
                        code={execution.toolCall.code}
                        language="typescript"
                        className="text-xs"
                      >
                        <CodeBlockHeader>
                          <CodeBlockTitle>
                            <Code2 className="w-3 h-3 text-purple-400" />
                            <CodeBlockFilename>playwright</CodeBlockFilename>
                          </CodeBlockTitle>
                          <CodeBlockActions>
                            <CodeBlockCopyButton className="h-6 w-6" />
                          </CodeBlockActions>
                        </CodeBlockHeader>
                      </CodeBlock>
                    </div>
                  )}

                  {/* Result/Output display */}
                  {execution.toolResult?.result && !hasError && (
                    <ToolOutput
                      output={execution.toolResult.result}
                      errorText={null}
                    />
                  )}

                  {/* Error display using StackTrace component */}
                  {hasError && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-destructive">
                        Error
                      </h4>
                      <StackTrace
                        trace={execution.toolResult!.error!}
                        defaultOpen
                        className="bg-red-500/5 border-red-500/20"
                      >
                        <StackTraceHeader>
                          <StackTraceError>
                            <StackTraceErrorType />
                            <StackTraceErrorMessage />
                          </StackTraceError>
                          <StackTraceActions>
                            <StackTraceCopyButton />
                            <StackTraceExpandButton />
                          </StackTraceActions>
                        </StackTraceHeader>
                        <StackTraceContent>
                          <StackTraceFrames showInternalFrames={false} />
                        </StackTraceContent>
                      </StackTrace>
                    </div>
                  )}
                </ToolContent>
              </Tool>
            );
          })}

          {/* Agent text response */}
          {hasText && (
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <MessageSquare className="w-3 h-3" />
                Agent Response
              </div>
              {textItems.map((item, textIndex) => (
                <p
                  key={`text-${textIndex}`}
                  className="text-sm text-gray-200 whitespace-pre-wrap"
                >
                  {item.text}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
