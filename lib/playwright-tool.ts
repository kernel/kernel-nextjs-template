import type Kernel from "@onkernel/sdk";
import { tool } from "ai";
import { z } from "zod";

export type PlaywrightExecuteOutput = {
  success: boolean;
  result?: unknown;
  error?: string;
  stdout?: string;
  stderr?: string;
  /** wall-clock time spent inside the browser vm */
  durationMs: number;
};

/**
 * The playwright execution tool. The agent writes code, this runs it inside the
 * browser vm over `kernel.browsers.playwright.execute` and hands the return
 * value back to the model.
 */
export function playwrightExecuteTool({
  client,
  sessionId,
}: {
  client: Kernel;
  sessionId: string;
}) {
  return tool({
    description:
      "Execute playwright code in the running KERNEL browser session. The code runs in the same vm as the browser and has `page`, `context`, `browser`, and `webmcp` in scope. Return a value to pass it back to the model. Playwright's own waits default to 30 seconds, so set a short timeout for anything the code has to wait on.",
    inputSchema: z.object({
      code: z
        .string()
        .min(1)
        .describe(
          "javascript that runs inside the browser vm. use a `return` statement for any value the model needs back. keep it fast: call `page.setDefaultTimeout(5000)` before touching selectors, or pass `{ timeout: 5000 }` per action.",
        ),
      timeout_sec: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("execution timeout in seconds, defaults to 60."),
    }),
    execute: async ({ code, timeout_sec }): Promise<PlaywrightExecuteOutput> => {
      const startedAt = Date.now();
      const response = await client.browsers.playwright.execute(sessionId, {
        code,
        timeout_sec,
      });

      return { ...response, durationMs: Date.now() - startedAt };
    },
  });
}
