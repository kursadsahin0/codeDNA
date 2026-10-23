import Link from "next/link";
import { SiteFrame } from "@/components/site/site-frame";
import { buttonVariants } from "@/components/ui/button-variants";
import { ErrorState } from "@/components/ui/error-state";

export default function NotFound() {
  return (
    <SiteFrame>
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <ErrorState
          heading="h1"
          title="Page not found"
          description="This route is not part of CodeDNA."
          action={
            <Link href="/" className={buttonVariants()}>
              Back to CodeDNA
            </Link>
          }
        />
      </div>
    </SiteFrame>
  );
}
