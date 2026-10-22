import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[14px] font-semibold ring-offset-background transition-[background-color,border-color,color,box-shadow,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Indigo: the one primary action on a surface. */
        default:
          "bg-indigo text-white shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18),0_1px_2px_hsl(var(--indigo-deep)/0.4),0_6px_14px_-6px_hsl(var(--indigo)/0.6)] hover:bg-indigo-deep disabled:bg-ink/[0.08] disabled:text-ink-3 disabled:shadow-none disabled:opacity-100",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border hairline-strong bg-window text-ink shadow-raised hover:border-indigo/40 hover:text-indigo-deep",
        secondary: "bg-indigo-soft text-indigo-deep hover:bg-indigo-line/60",
        ghost: "text-ink-2 hover:bg-ink/[0.05] hover:text-ink",
        link: "text-indigo underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 rounded-lg px-3 text-[13px]",
        lg: "h-12 px-6 text-[15px]",
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
