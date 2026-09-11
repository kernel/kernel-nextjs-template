"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { AgentStepsSidebar } from "@/components/AgentStepsSidebar";
import { BrowserPanel } from "@/components/BrowserPanel";
import { Header } from "@/components/Header";
import { HowItWorks } from "@/components/HowItWorks";
import { StackTrace } from "@/components/ai-elements/stack-trace";
import { Button } from "@/components/ui/button";
import type { AgentUIMessage, BrowserSession } from "@/lib/types";

const transport = new DefaultChatTransport<AgentUIMessage>({
  api: "/api/agent",
});

export default function HomePage() {
  const [session, setSession] = useState<BrowserSession | null>(null);
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);

  const {
    messages,
    sendMessage,
    status,
    error: chatError,
    stop,
    setMessages,
  } = useChat<AgentUIMessage>({ transport });

  const stats = useMemo(() => {
    let executions = 0;
    let executionMs = 0;

    for (const message of messages) {
      for (const part of message.parts) {
        if (part.type !== "tool-playwright_execute") continue;
        if (part.state !== "output-available") continue;
        executions += 1;
        executionMs += part.output.durationMs;
      }
    }

    return { executions, executionMs };
  }, [messages]);

  const createBrowser = async () => {
    setCreating(true);
    setError(null);
    setDeployUrl(null);

    try {
      const response = await fetch("/api/create-browser", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setMessages([]);
        setSession({
          sessionId: data.sessionId,
          liveViewUrl: data.liveViewUrl,
          cdpWsUrl: data.cdpWsUrl,
          spinUpTime: data.spinUpTime,
          region: data.region,
          stealth: data.stealth,
        });
      } else {
        if (data.error === "MISSING_API_KEY" && data.deployUrl) {
          setDeployUrl(data.deployUrl);
        }
        setError(data.message ?? data.error ?? "failed to create browser");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "failed to reach the api");
    } finally {
      setCreating(false);
    }
  };

  const closeBrowser = async () => {
    if (!session) return;

    setClosing(true);

    try {
      await fetch("/api/delete-browser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.sessionId }),
      });

      setSession(null);
      setMessages([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "failed to close browser");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[1312px] flex-1 px-4 py-8 md:px-8 lg:px-16 lg:py-12">
        {session ? (
          <div className="flex flex-col gap-6 lg:flex-row">
            <BrowserPanel
              session={session}
              executions={stats.executions}
              executionMs={stats.executionMs}
              closing={closing}
              onClose={closeBrowser}
            />
            <AgentStepsSidebar
              messages={messages}
              status={status}
              error={chatError}
              onSend={(task) =>
                sendMessage({ text: task }, { body: { sessionId: session.sessionId } })
              }
              onStop={stop}
            />
          </div>
        ) : (
          <div className="space-y-12">
            <section className="max-w-[752px] space-y-6">
              <h1 className="text-heading-04 text-charcoal md:text-heading-02">
                instant browser infra for your next.js agent
              </h1>
              <p className="text-body-expanded-01 text-grey-light-11">
                one call gives you a chromium session with a live view. describe
                a task, and a gpt-5.4 agent writes playwright, runs it in the
                browser vm, and returns the value. every generated line stays
                visible next to the browser it ran in.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={createBrowser} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      creating browser
                    </>
                  ) : (
                    "create a browser"
                  )}
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="https://kernel.sh/docs" target="_blank" rel="noreferrer">
                    read the docs
                  </a>
                </Button>
              </div>
            </section>

            {error && (
              <section className="max-w-[752px] space-y-4 border border-charcoal bg-beige-muted p-6">
                <StackTrace error={error} className="border-0 bg-transparent p-0" />
                {deployUrl && (
                  <Button variant="secondary" size="md" asChild>
                    <a href={deployUrl} target="_blank" rel="noreferrer">
                      deploy with vercel
                    </a>
                  </Button>
                )}
              </section>
            )}

            <Image
              src="/template-preview.png"
              alt="the template running: a KERNEL browser on the left and the agent's generated playwright on the right"
              width={1920}
              height={928}
              priority
              className="w-full border border-grey-light-07"
            />

            <HowItWorks />
          </div>
        )}
      </main>

      <footer className="border-t border-grey-light-07">
        <div className="mx-auto flex max-w-[1312px] flex-wrap items-center justify-between gap-4 px-4 py-8 md:px-8 lg:px-16">
          <p className="text-body-03 text-grey-light-11">
            powered by <a href="https://kernel.sh">KERNEL</a>, the{" "}
            <a href="https://ai-sdk.dev">vercel ai sdk</a>, and{" "}
            <a href="https://vercel.com">vercel</a>.
          </p>
          <nav className="flex gap-6 text-body-03 text-grey-light-11">
            <a href="https://kernel.sh/docs">docs</a>
            <a href="https://dashboard.onkernel.com">dashboard</a>
            <a href="https://github.com/kernel/kernel-nextjs-template">
              github
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
