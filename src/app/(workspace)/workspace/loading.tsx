import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return <div aria-label="Loading repository overview" className="space-y-5" role="status"><Skeleton className="h-24 w-full" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 w-full" />)}</div><div className="grid gap-4 xl:grid-cols-2"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div><Skeleton className="h-52 w-full" /><span className="sr-only">Loading overview data…</span></div>;
}
