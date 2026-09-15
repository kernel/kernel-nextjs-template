import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-[4px] border-[0.5px] px-2 py-1 text-body-03 font-normal",
  {
    variants: {
      variant: {
        light: "border-charcoal text-charcoal",
        dark: "border-grey-dark-12 text-grey-dark-12",
      },
    },
    defaultVariants: {
      variant: "light",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
