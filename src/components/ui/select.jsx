// @ts-nocheck
"use client";

"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { Drawer } from "vaul"
import { useIsMobile } from "@/hooks/use-mobile"

import { cn } from "@/lib/utils"

// --- Mobile bottom-sheet select (vaul) for viewports < 768px ---
// On phones the same Select/SelectTrigger/SelectValue/SelectContent/SelectItem
// API renders a bottom-sheet drawer instead of a Radix popover.
const MobileSelectContext = React.createContext(null)

function flattenText(node) {
  if (node == null || typeof node === "boolean" || node === "") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (React.isValidElement(node)) {
    if (node.type === SelectPrimitive.ItemText) return flattenText(node.props.children);
    return React.Children.toArray(node.props?.children).map(flattenText).join("");
  }
  return "";
}

function collectItems(children, items = {}) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      items[child.props.value] = flattenText(child.props.children);
    }
    if (child.props?.children) collectItems(child.props.children, items);
  });
  return items;
}

const Select = ({ value, defaultValue, onValueChange, children, ...props }) => {
  const isMobile = useIsMobile();
  const [internal, setInternal] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);

  if (!isMobile) {
    return (
      <SelectPrimitive.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} {...props}>
        {children}
      </SelectPrimitive.Root>
    );
  }

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internal;
  const handleChange = (v) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };
  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <MobileSelectContext.Provider
        value={{ value: currentValue, onValueChange: handleChange, setOpen, items: collectItems(children) }}
      >
        {children}
      </MobileSelectContext.Provider>
    </Drawer.Root>
  );
};

const SelectGroup = ({ children, ...props }) => {
  const ctx = React.useContext(MobileSelectContext);
  if (ctx) return <div {...props}>{children}</div>;
  return <SelectPrimitive.Group {...props}>{children}</SelectPrimitive.Group>;
};

const SelectValue = ({ placeholder, children }) => {
  const ctx = React.useContext(MobileSelectContext);
  if (ctx) {
    const label = ctx.items?.[ctx.value];
    return (
      <span className={label ? undefined : "text-muted-foreground"}>{label || placeholder}</span>
    );
  }
  return <SelectPrimitive.Value placeholder={placeholder}>{children}</SelectPrimitive.Value>;
};

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext);
  if (ctx) {
    return (
      <Drawer.Trigger asChild>
        <button
          type="button"
          ref={ref}
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            className
          )}
          {...props}
        >
          {children}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </Drawer.Trigger>
    );
  }
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext);
  if (ctx) return null;
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}>
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  )
})
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext);
  if (ctx) return null;
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}>
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  )
})
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext);
  if (ctx) {
    return (
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[70] bg-black/60" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-[80] mx-auto max-w-lg rounded-t-2xl border border-border bg-card pb-[env(safe-area-inset-bottom)]",
            className
          )}
        >
          <Drawer.Title className="sr-only">Select an option</Drawer.Title>
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted-foreground/40" />
          <div className="max-h-[50vh] overflow-y-auto p-1">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    );
  }
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn("p-1", position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext);
  if (ctx) return <div ref={ref} className={cn("px-3 py-1.5 text-sm font-semibold", className)} {...props} />;
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props} />
  )
})
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef(({ className, children, disabled, value, ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext);
  if (ctx) {
    const selected = value === ctx.value;
    return (
      <button
        type="button"
        ref={ref}
        disabled={disabled}
        data-disabled={disabled ? "" : undefined}
        onClick={() => { ctx.onValueChange(value); ctx.setOpen(false); }}
        className={cn(
          "flex w-full items-center justify-between rounded-sm px-3 py-3 text-left text-sm outline-none hover:bg-secondary/50 transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          selected && "text-primary",
          className
        )}
        {...props}
      >
        <span className="flex-1">{children}</span>
        {selected && <Check className="h-4 w-4" />}
      </button>
    );
  }
  return (
    <SelectPrimitive.Item
      ref={ref}
      value={value}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}>
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext);
  if (ctx) return <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />;
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props} />
  )
})
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
