import * as React from "react";

import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-[#FFC107] text-black hover:bg-[#f6ba00]",
        variant === "outline" && "border border-[#1F1F1F] bg-[#111111] text-[#F5F5F5] hover:bg-[#171717]",
        variant === "ghost" && "bg-transparent text-[#F5F5F5] hover:bg-[#171717]",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button };
