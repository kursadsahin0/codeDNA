import { fanInRows, harborEdges, harborNodes, kindLabel } from "@/lib/demo/harbor";

const rows = fanInRows();

export function ComplexityPreview() {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-border px-3 py-2 font-mono text-xs text-foreground-secondary">
        <span>{harborNodes.length} files</span>
        <span>{harborEdges.length} imports</span>
        <span>Highest fan-in: src/context.ts</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <caption className="sr-only">
            Fan-in and fan-out preview for repository files
          </caption>
          <thead className="border-b border-border text-xs text-foreground-tertiary">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                File
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Kind
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Imported by
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Imports
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.node.id} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-3 py-2 font-mono text-xs font-normal text-foreground">
                  {row.node.path}
                </th>
                <td className="px-3 py-2 text-xs text-foreground-secondary">
                  {kindLabel[row.node.kind]}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-foreground tabular-nums">
                  {row.fanIn}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-foreground tabular-nums">
                  {row.fanOut}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
