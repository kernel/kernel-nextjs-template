import { openai } from "@ai-sdk/openai";
import { playwrightExecuteTool } from "@onkernel/ai-sdk";
import { Kernel } from "@onkernel/sdk";
import { Experimental_Agent as Agent, stepCountIs } from "ai";

export const maxDuration = 300; // 5 minutes timeout for long-running agent operations

export async function POST(req: Request) {
  try {
    const { sessionId, task } = await req.json();

    if (!sessionId || !task) {
      return Response.json(
        { error: "Missing sessionId or task" },
        { status: 400 }
      );
    }

    const apiKey = process.env.KERNEL_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "KERNEL_API_KEY environment variable is not set" },
        { status: 400 }
      );
    }

    if (!openaiKey) {
      return Response.json(
        { error: "OPENAI_API_KEY environment variable is not set" },
        { status: 400 }
      );
    }

    const kernel = new Kernel({ apiKey });

    // Initialize the AI agent with GPT-5.1
    const agent = new Agent({
      model: openai("gpt-5.1"),
      tools: {
        playwright_execute: playwrightExecuteTool({
          client: kernel,
          sessionId: sessionId,
        }),
      },
      stopWhen: stepCountIs(20),
      system: `You are a browser automation expert with access to a Playwright execution tool.

Available tools:
- playwright_execute: Executes JavaScript/Playwright code in the browser. Has access to 'page', 'context', and 'browser' objects. Returns the result of your code.

When given a task:
1. If no URL is provided, FIRST get the current page context:
   return { url: page.url(), title: await page.title() }
2. If a URL is provided, navigate to it using page.goto()
3. Use appropriate selectors (page.locator, page.getByRole, etc.) to interact with elements
4. Always return the requested data from your code execution

Important: Write concise code that solves one atomic step at a time. Break complex tasks into small, focused executions rather than writing long scripts.

Execute tasks autonomously without asking clarifying questions. Make reasonable assumptions and proceed.`,
    });

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    let stepCount = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Execute the agent with step callbacks
          const { text, steps, usage } = await agent.generate({
            prompt: task,
            onStepFinish: ({ stepType, text: stepText, toolCalls, toolResults, finishReason, usage: stepUsage }) => {
              stepCount++;
              
              // Process the step content
              const content: any[] = [];
              
              // Add tool calls
              if (toolCalls && toolCalls.length > 0) {
                for (const tc of toolCalls) {
                  content.push({
                    type: "tool-call",
                    toolCallId: tc.toolCallId,
                    toolName: tc.toolName,
                    code: tc.args?.code || null,
                  });
                }
              }
              
              // Add tool results
              if (toolResults && toolResults.length > 0) {
                for (const tr of toolResults) {
                  content.push({
                    type: "tool-result",
                    toolCallId: tr.toolCallId,
                    toolName: tr.toolName,
                    result: tr.result?.result,
                    success: tr.result?.success ?? true,
                    error: tr.result?.error,
                  });
                }
              }
              
              // Add text if present
              if (stepText) {
                content.push({
                  type: "text",
                  text: stepText,
                });
              }
              
              const stepData = {
                type: "step",
                step: {
                  stepNumber: stepCount,
                  finishReason: finishReason || null,
                  content,
                },
              };
              
              // Send the step as SSE
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(stepData)}\n\n`));
            },
          });

          // Send the final result
          const finalData = {
            type: "done",
            success: true,
            response: text,
            stepCount: steps.length,
            usage,
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`));
          controller.close();
        } catch (error: any) {
          console.error("Agent execution error:", error);
          const errorData = {
            type: "error",
            success: false,
            error: error.message || "Failed to execute agent",
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Agent execution error:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "Failed to execute agent",
      },
      { status: 500 }
    );
  }
}
