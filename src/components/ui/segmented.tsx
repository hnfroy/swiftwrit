"use client";
import * as TG from "@radix-ui/react-toggle-group";

type Opt<T extends string> = { value: T; label: string };
export function Segmented<T extends string>({ value, onChange, options, label }: {
  value: T; onChange: (v: T) => void; options: Opt<T>[]; label: string;
}) {
  return (
    <TG.Root type="single" value={value} onValueChange={(v) => v && onChange(v as T)} aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <TG.Item
          key={o.value}
          value={o.value}
          className="h-9 rounded-[10px] border border-border bg-white px-3 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {o.label}
        </TG.Item>
      ))}
    </TG.Root>
  );
}
