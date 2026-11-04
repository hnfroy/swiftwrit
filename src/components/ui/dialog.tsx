"use client";
import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTitle = D.Title;
export const DialogClose = D.Close;
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof D.Content>,
  React.ComponentPropsWithoutRef<typeof D.Content>
>(({ className, children, ...props }, ref) => (
  <D.Portal>
    <D.Overlay className="fixed inset-0 z-50 bg-black/50" />
    <D.Content
      ref={ref}
      className={cn("fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-border bg-white shadow-2xl outline-none", className)}
      {...props}
    >
      {children}
    </D.Content>
  </D.Portal>
));
DialogContent.displayName = "DialogContent";
export const DialogDescription = D.Description;
