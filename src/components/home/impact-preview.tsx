import { impactOf, kindLabel } from "@/lib/demo/harbor";

const impact = impactOf("context");

export function ImpactPreview() {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs text-foreground-tertiary">Changed file</p>
        <p className="font-mono text-sm text-foreground">{impact.changed.path}</p>
      </div>
      <div className="grid sm:grid-cols-2">
        <section
          className="border-b border-border p-3 sm:border-r sm:border-b-0"
          aria-labelledby="reached-title"
        >
          <h3 id="reached-title" className="text-xs font-medium text-foreground">
            Reached
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {impact.reached.map((hit) => (
              <li key={hit.node.id} className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs text-foreground">{hit.node.path}</span>
                <span className="shrink-0 text-[11px] text-foreground-tertiary">
                  {hit.depth === 1 ? "Imports it" : `Depth ${hit.depth}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="p-3" aria-labelledby="unaffected-title">
          <h3 id="unaffected-title" className="text-xs font-medium text-foreground">
            Unaffected
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {impact.unaffected.map((node) => (
              <li key={node.id} className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs text-foreground">{node.path}</span>
                <span className="shrink-0 text-[11px] text-foreground-tertiary">
                  {kindLabel[node.kind]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
