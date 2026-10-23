"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";
import { fieldClassName } from "./input";

type SearchInputProps = {
  label: string;
  hideLabel?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  hotkey?: string;
  className?: string;
};

export function SearchInput({
  label,
  hideLabel = false,
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Search",
  hotkey,
  className,
}: SearchInputProps) {
  const generatedId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;

  function update(next: string) {
    if (value === undefined) {
      setUncontrolled(next);
    }
    onValueChange?.(next);
  }

  useEffect(() => {
    if (!hotkey) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() !== hotkey?.toLowerCase()) return;
      if (document.querySelector("[role='dialog'], [role='menu']")) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkey]);

  return (
    <form
      role="search"
      className={cn("w-full", className)}
      onSubmit={(event) => event.preventDefault()}
    >
      <label
        htmlFor={generatedId}
        className={cn(
          "mb-1.5 block text-xs font-medium text-foreground-secondary",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-foreground-tertiary"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={generatedId}
          type="search"
          value={current}
          onChange={(event) => update(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className={cn(fieldClassName, "h-9 pr-14 pl-8 text-sm")}
        />
        <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center">
          {current.length > 0 ? (
            <IconButton label="Clear search" size="sm" onClick={() => update("")}>
              <X />
            </IconButton>
          ) : hotkey ? (
            <kbd className="pointer-events-none hidden h-5 min-w-5 items-center justify-center border border-border bg-background-subtle px-1 font-mono text-[10px] text-foreground-tertiary sm:inline-flex">
              {hotkey}
            </kbd>
          ) : null}
        </div>
      </div>
    </form>
  );
}
