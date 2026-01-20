import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded text-xs font-medium uppercase tracking-wide ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border border-primary/20 hover:bg-primary/90",
        destructive: "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20",
        outline: "border border-border bg-transparent hover:bg-muted/50 text-foreground",
        secondary: "bg-secondary/50 text-secondary-foreground border border-border hover:bg-secondary/70",
        ghost: "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
        link: "text-accent underline-offset-4 hover:underline",
        // F1 control panel variants
        control: "bg-card border border-border text-foreground hover:border-accent/50 hover:text-accent",
        controlActive: "bg-accent/10 border border-accent/40 text-accent",
      },
      size: {
        default: "h-8 px-3 py-1.5",
        sm: "h-7 px-2.5 py-1",
        lg: "h-9 px-4 py-2",
        icon: "h-8 w-8",
        xs: "h-6 px-2 py-0.5 text-[10px]",
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
