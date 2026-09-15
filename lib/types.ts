import type { UIMessage } from "ai";
import type { PlaywrightExecuteOutput } from "./playwright-tool";

export type PlaywrightExecuteInput = {
  code: string;
  timeout_sec?: number;
};

export type AgentUIMessage = UIMessage<
  never,
  never,
  {
    playwright_execute: {
      input: PlaywrightExecuteInput;
      output: PlaywrightExecuteOutput;
    };
  }
>;

export type BrowserSession = {
  sessionId: string;
  liveViewUrl: string;
  cdpWsUrl: string;
  spinUpTime: number;
  region: string;
  stealth: boolean;
};
