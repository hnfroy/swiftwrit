"use client";
import * as React from "react";
import * as T from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = T.Provider;
export const Tooltip = T.Root;
export const TooltipTrigger = T.Trigger;
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof T.Content>,
  React.ComponentPropsWithoutRef<typeof T.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <T.Portal>
    <T.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn("z-[60] rounded-md bg-[#141414] px-2.5 py-1.5 text-xs font-medium text-white shadow-md", className)}
      {...props}
    />
  </T.Portal>
));
TooltipContent.displayName = "TooltipContent";
