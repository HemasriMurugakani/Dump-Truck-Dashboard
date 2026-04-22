import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-[#1F1F1F] bg-[#0F0F0F] px-3 py-2 text-sm text-[#F5F5F5] placeholder:text-[#4B5563] focus:outline-none focus:ring-1 focus:ring-[#FFC107]",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
