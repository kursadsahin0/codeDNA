"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { ErrorState } from "@/components/ui/error-state";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col justify-center bg-background px-4 py-16 text-foreground md:px-8">
      <ErrorState
        heading="h1"
        title="This page failed to render"
        description={
          error.digest
            ? `Try again. Reference ${error.digest}.`
            : "Try again. No request was sent to a repository."
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={reset}>Try again</Button>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Back to CodeDNA
            </Link>
          </div>
        }
      />
    </div>
  );
}
