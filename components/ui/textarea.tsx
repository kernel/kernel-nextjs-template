import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-24 w-full resize-none border border-charcoal bg-beige-light px-3 py-3 text-body-02 text-charcoal placeholder:text-grey-light-11 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-kernel-green disabled:opacity-32",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
