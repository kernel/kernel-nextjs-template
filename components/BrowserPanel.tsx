import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HowItWorks } from "@/components/HowItWorks";
import type { BrowserSession } from "@/lib/types";
import { useEffect, useState } from "react";

/**
 * The session's hard deadline, counted from the moment this mounts, which is
 * when the session was created.
 */
function ClosesIn({ expiresAt }: { expiresAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-mono-02 text-grey-light-11">
      closes in {Math.max(1, Math.ceil((expiresAt - now) / 60000))}m
    </span>
  );
}

export function BrowserPanel({
  session,
  executions,
  executionMs,
  expiresAt,
  closing,
  onClose,
}: {
  session: BrowserSession;
  executions: number;
  executionMs: number;
  expiresAt: number;
  closing: boolean;
  onClose: () => void;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="gap-2">
            <span className="size-1.5 rounded-full bg-kernel-green" />
            live
          </Badge>
          <span
            className="text-mono-02 text-grey-light-11"
            data-preserve-case
          >
            {session.sessionId}
          </span>
          <span className="text-mono-02 text-grey-light-11">
            {session.spinUpTime}ms spin-up
          </span>
          <span className="text-mono-02 text-grey-light-11">
            {session.region}
          </span>
          {session.stealth && (
            <span className="text-mono-02 text-grey-light-11">stealth</span>
          )}
          <ClosesIn expiresAt={expiresAt} />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={closing}
        >
          {closing ? "closing" : "close browser"}
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center lg:[container-type:size]">
        <div className="aspect-[16/10] w-full max-w-[900px] border border-charcoal bg-charcoal lg:w-[min(100cqw,900px,160cqh)]">
          <iframe
            src={session.liveViewUrl}
            title="KERNEL browser live view"
            className="h-full w-full"
            allow="camera; microphone; display-capture"
          />
        </div>
      </div>

      <div className="w-full max-w-[900px] self-center">
        <HowItWorks
          layout="list"
          spinUpTime={session.spinUpTime}
          executions={executions}
          executionMs={executionMs}
        />
      </div>
    </section>
  );
}
