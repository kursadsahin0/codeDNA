"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Specimen } from "./specimen";
import { ShowcaseSection } from "./showcase-section";

const tokenNames = ["--background", "--primary", "--danger", "--graph-module"];

export const inputSection = {
  id: "inputs",
  title: "Inputs",
  keywords: "input search form field error disabled validation",
};

export function InputSection() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState<string | undefined>();
  const [query, setQuery] = useState("");

  const matches = tokenNames.filter((token) => token.includes(query.trim().toLowerCase()));

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = name.trim();
    if (!next) {
      setSaved(undefined);
      setError("Enter a display name.");
      return;
    }
    setError(undefined);
    setSaved(next);
  }

  return (
    <ShowcaseSection
      id={inputSection.id}
      title={inputSection.title}
      description="Labels are always present. The page search above filters this inventory and focuses with /."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Specimen label="Validation">
          <form className="flex flex-col gap-3" onSubmit={onSubmit}>
            <Input
              label="Display name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              hint="Stored only in this example."
              error={error}
              autoComplete="name"
            />
            <div className="flex items-center gap-3">
              <Button type="submit">Apply</Button>
              {saved ? (
                <p className="text-sm text-foreground-secondary">Saved in this example: {saved}</p>
              ) : null}
            </div>
          </form>
        </Specimen>
        <Specimen label="States" className="flex flex-col gap-4">
          <Input
            label="Repository"
            value="Not connected"
            readOnly
            error="Repository access is not implemented."
          />
          <Input label="Analysis engine" placeholder="Not available" disabled />
        </Specimen>
        <Specimen label="Search" className="lg:col-span-2">
          <SearchInput
            label="Filter token names"
            placeholder="Filter token names"
            value={query}
            onValueChange={setQuery}
            className="max-w-sm"
          />
          <ul className="mt-3 space-y-1">
            {matches.length > 0 ? (
              matches.map((token) => (
                <li key={token} className="font-mono text-[13px] text-foreground">
                  {token}
                </li>
              ))
            ) : (
              <li className="text-sm text-foreground-secondary">No matching tokens.</li>
            )}
          </ul>
        </Specimen>
      </div>
    </ShowcaseSection>
  );
}
