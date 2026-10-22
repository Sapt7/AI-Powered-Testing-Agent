import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-semibold ring-offset-background transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Safety yellow: the control that starts a run. One per surface. */
        default:
          "bg-safety text-ink shadow-[inset_0_-2px_0_hsl(var(--safety-deep)),0_1px_2px_hsl(var(--ink)/0.15)] hover:bg-[hsl(46_96%_58%)] disabled:bg-facility-deep disabled:text-ink-3 disabled:shadow-none disabled:opacity-100",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-line-strong bg-panel text-ink shadow-[0_1px_0_hsl(0_0%_100%/0.7)_inset] hover:border-ink/60",
        secondary: "bg-secondary text-secondary-foreground hover:bg-facility-deep/80",
        ghost: "text-ink-2 hover:bg-facility-deep hover:text-ink",
        /* For controls sitting on graphite. */
        graphite:
          "border border-flow/15 bg-graphite-2 text-flow hover:border-flow/35 hover:bg-graphite-3 focus-visible:ring-safety focus-visible:ring-offset-graphite",
        link: "text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-12 px-6 text-[14px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
