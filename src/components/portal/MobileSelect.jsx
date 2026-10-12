import React, { useState } from "react";
import { Drawer } from "vaul";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Select control that opens a vaul bottom sheet on phones (< 768px)
// and the standard dropdown popover everywhere else.
export default function MobileSelect({ value, onValueChange, options, placeholder }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
        >
          <span className={selected ? "" : "text-muted-foreground"}>{selected ? selected.label : placeholder}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[70] bg-black/60" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[80] mx-auto max-w-lg rounded-t-2xl border border-border bg-card pb-[env(safe-area-inset-bottom)]">
          <Drawer.Title className="sr-only">{placeholder}</Drawer.Title>
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted-foreground/40" />
          <p className="px-5 pt-4 pb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{placeholder}</p>
          <div className="max-h-[50vh] overflow-y-auto pb-2">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onValueChange(o.value); setOpen(false); }}
                className={cn(
                  "flex w-full items-center justify-between px-5 py-3 text-left text-sm hover:bg-secondary/50 transition-colors",
                  o.value === value && "text-primary"
                )}
              >
                {o.label}
                {o.value === value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}