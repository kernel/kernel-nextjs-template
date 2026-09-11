const CALLS = [
  {
    step: "01",
    name: "create",
    call: "kernel.browsers.create()",
    body: "KERNEL provisions a chromium session and hands back a live view url and a cdp endpoint.",
  },
  {
    step: "02",
    name: "execute",
    call: "kernel.browsers.playwright.execute()",
    body: "the agent writes playwright, the tool runs it in the same vm as the browser. one round trip per step.",
  },
  {
    step: "03",
    name: "delete",
    call: "kernel.browsers.deleteByID()",
    body: "closing the browser deletes the session, so nothing keeps running on our side.",
  },
];

/**
 * The three SDK calls the template makes, with the numbers from the current
 * session when there is one.
 */
export function HowItWorks({
  spinUpTime,
  executions,
  executionMs,
}: {
  spinUpTime?: number;
  executions?: number;
  executionMs?: number;
}) {
  const values: Record<string, string | undefined> = {
    create: spinUpTime === undefined ? undefined : `${spinUpTime}ms`,
    execute:
      executions === undefined
        ? undefined
        : `${executions} call${executions === 1 ? "" : "s"}${
            executionMs === undefined ? "" : ` · ${executionMs}ms in browser`
          }`,
    delete: undefined,
  };

  return (
    <div className="grid gap-px border border-grey-light-07 bg-grey-light-07 md:grid-cols-3">
      {CALLS.map((entry) => (
        <div key={entry.name} className="bg-beige-light p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-tag text-grey-light-11">{entry.name}</span>
            <span className="text-mono-02 text-grey-light-11">{entry.step}</span>
          </div>

          <p className="text-mono-02 mt-4 text-charcoal" data-preserve-case>
            {entry.call}
          </p>

          {values[entry.name] && (
            <p className="text-mono-02 mt-1 text-kernel-green">
              {values[entry.name]}
            </p>
          )}

          <p className="text-body-03 mt-4 text-grey-light-11">{entry.body}</p>
        </div>
      ))}
    </div>
  );
}
