import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kernel-green disabled:pointer-events-none disabled:opacity-32 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-kernel-green text-charcoal hover:underline",
        secondary: "bg-charcoal text-beige hover:underline",
        outline:
          "border border-charcoal text-charcoal hover:bg-charcoal hover:text-beige",
        ghost: "text-charcoal hover:text-grey-light-11",
        link: "underline decoration-[0.5px] underline-offset-2 hover:text-charcoal/70",
        gold: "bg-charcoal text-gold hover:underline",
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
        icon: "p-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
