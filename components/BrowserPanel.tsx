import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HowItWorks } from "@/components/HowItWorks";
import type { BrowserSession } from "@/lib/types";

export function BrowserPanel({
  session,
  executions,
  executionMs,
  closing,
  busy,
  onClose,
}: {
  session: BrowserSession;
  executions: number;
  executionMs: number;
  closing: boolean;
  busy: boolean;
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
          disabled={closing || busy}
          title={busy ? "stop the current run before closing" : undefined}
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
