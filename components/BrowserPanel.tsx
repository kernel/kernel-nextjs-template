import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HowItWorks } from "@/components/HowItWorks";
import type { BrowserSession } from "@/lib/types";

export function BrowserPanel({
  session,
  executions,
  executionMs,
  closing,
  onClose,
}: {
  session: BrowserSession;
  executions: number;
  executionMs: number;
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

      <div className="flex min-h-0 items-center justify-center border border-charcoal bg-charcoal lg:flex-1">
        <iframe
          src={session.liveViewUrl}
          title="KERNEL browser live view"
          className="aspect-[16/10] w-full lg:h-full lg:w-auto"
          allow="camera; microphone; display-capture"
        />
      </div>

      <HowItWorks
        layout="list"
        spinUpTime={session.spinUpTime}
        executions={executions}
        executionMs={executionMs}
      />
    </section>
  );
}
