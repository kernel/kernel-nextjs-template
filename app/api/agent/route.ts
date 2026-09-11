import { openai } from "@ai-sdk/openai";
import { Kernel } from "@onkernel/sdk";
import { ToolLoopAgent, createAgentUIStreamResponse, stepCountIs } from "ai";
import { playwrightExecuteTool } from "@/lib/playwright-tool";
import type { AgentUIMessage } from "@/lib/types";

export const maxDuration = 300;

const INSTRUCTIONS = `you drive a KERNEL cloud browser by writing playwright code.

the browser session already exists and starts on about:blank. inside the execution tool you have \`page\`, \`context\`, \`browser\`, and \`webmcp\` in scope. the tool runs in the same vm as the browser.

how to work:
- one atomic step per call: navigate, then inspect, then act, then extract. short snippets beat long scripts.
- the return value is the only thing you get back, so return the data the task asks for.
- when a selector misses, inspect the page instead of guessing the same selector again.
- finish with one or two sentences of plain prose. no preamble, no restating the task.`;

export async function POST(req: Request) {
  const { messages, sessionId } = (await req.json()) as {
    messages?: AgentUIMessage[];
    sessionId?: string;
  };

  if (!sessionId) {
    return Response.json({ error: "missing sessionId" }, { status: 400 });
  }

  const apiKey = process.env.KERNEL_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "KERNEL_API_KEY environment variable is not set" },
      { status: 400 },
    );
  }

  const kernel = new Kernel({ apiKey });

  const agent = new ToolLoopAgent({
    model: openai("gpt-5.4"),
    instructions: INSTRUCTIONS,
    tools: {
      playwright_execute: playwrightExecuteTool({ client: kernel, sessionId }),
    },
    stopWhen: stepCountIs(24),
  });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages ?? [],
    abortSignal: req.signal,
  });
}
