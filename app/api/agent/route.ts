import { openai } from "@ai-sdk/openai";
import { Kernel } from "@onkernel/sdk";
import { ToolLoopAgent, convertToModelMessages, stepCountIs } from "ai";
import { AGENT_STEP_LIMIT } from "@/lib/constants";
import { playwrightExecuteTool } from "@/lib/playwright-tool";
import type { AgentUIMessage } from "@/lib/types";

export const maxDuration = 300;

const INSTRUCTIONS = `you drive a KERNEL cloud browser by writing playwright code.

the browser session already exists and starts on about:blank. inside the execution tool you have \`page\`, \`context\`, \`browser\`, and \`webmcp\` in scope. the tool runs in the same vm as the browser.

how to work:
- one atomic step per call: navigate, then inspect, then act, then extract. short snippets beat long scripts.
- the return value is the only thing you get back, so return the data the task asks for.
- when a selector misses, inspect the page instead of guessing the same selector again.
- finish with one or two sentences of plain prose. no preamble, no restating the task.
- you have a hard budget of ${AGENT_STEP_LIMIT} tool calls for this task. if you can tell you won't finish in time, say so plainly in your closing sentence instead of trailing off mid-task.

timeouts:
- playwright waits 30 seconds before every locator action gives up, which is far longer than anyone is watching. never leave that default in place.
- open a snippet that touches a selector with \`page.setDefaultTimeout(5000)\`, or pass \`{ timeout: 5000 }\` to the action itself. use up to 15000 for \`page.goto\` on a heavy site, and nothing higher unless the task says otherwise.
- keep waits you write yourself short too: \`waitForSelector(selector, { timeout: 5000 })\`.
- to read a value that may not be there, check first (\`await locator.count()\`, \`isVisible()\`) and skip the row, instead of awaiting the text and catching the failure. a \`.catch()\` does not shorten the 30 second wait it is wrapping.`;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    messages?: AgentUIMessage[];
    sessionId?: string;
  } | null;

  if (!body?.sessionId) {
    return Response.json({ error: "missing sessionId" }, { status: 400 });
  }

  const { messages, sessionId } = body;

  const apiKey = process.env.KERNEL_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "KERNEL_API_KEY environment variable is not set" },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY environment variable is not set" },
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
    stopWhen: stepCountIs(AGENT_STEP_LIMIT),
  });

  // a stopped run leaves a tool call without a result, which the model would
  // reject on the next turn
  const result = await agent.stream({
    messages: await convertToModelMessages(messages ?? [], {
      ignoreIncompleteToolCalls: true,
    }),
    abortSignal: req.signal,
  });

  // this template runs on the deployer's own keys, so the real error is safe
  // to show them (the ai sdk otherwise masks every failure as one generic string)
  return result.toUIMessageStreamResponse({
    onError: (error) => (error instanceof Error ? error.message : "an unexpected error occurred"),
  });
}
