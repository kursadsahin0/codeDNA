"use client";

import { ArrowUp, Circle, FileCode2, Folder, Maximize2, Minus, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from "react";
import type { AnalysisEdge, AnalysisGraph, AnalysisNode } from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

type Level = "folders" | "files" | "symbols";
type PositionedNode = AnalysisNode & { x: number; y: number; degree: number; count?: number };
type Props = { graph: AnalysisGraph; changedFiles?: string[]; htmlUrl?: string; commit?: string; commitSubject?: string };

const label: Record<string, string> = { file: "File", module: "Module", function: "Function", class: "Class" };

function dir(path: string) { const parts = path.split("/"); return parts.length > 1 ? parts.slice(0, -1).join("/") : "."; }
function cyclicNodeIds(nodes: AnalysisNode[], edges: AnalysisEdge[]) {
  const files = nodes.filter((node) => node.kind === "file").map((node) => node.id);
  const adjacency = new Map(files.map((id) => [id, [] as string[]]));
  for (const edge of edges) if (edge.kind === "import" && adjacency.has(edge.source) && adjacency.has(edge.target)) adjacency.get(edge.source)!.push(edge.target);
  let index = 0; const stack: string[] = []; const onStack = new Set<string>(); const indices = new Map<string, number>(); const low = new Map<string, number>(); const cyclic = new Set<string>();
  const visit = (id: string) => {
    indices.set(id, index); low.set(id, index++); stack.push(id); onStack.add(id);
    for (const target of adjacency.get(id) ?? []) {
      if (!indices.has(target)) { visit(target); low.set(id, Math.min(low.get(id)!, low.get(target)!)); }
      else if (onStack.has(target)) low.set(id, Math.min(low.get(id)!, indices.get(target)!));
    }
    if (low.get(id) === indices.get(id)) {
      const component: string[] = []; let member: string;
      do { member = stack.pop()!; onStack.delete(member); component.push(member); } while (member !== id);
      if (component.length > 1 || (adjacency.get(id) ?? []).includes(id)) component.forEach((entry) => cyclic.add(entry));
    }
  };
  for (const id of files) if (!indices.has(id)) visit(id);
  return cyclic;
}

export function ArchitectureGraph({ graph, changedFiles = [], htmlUrl, commit, commitSubject }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState<Level>(graph.nodes.length > 700 ? "folders" : "files");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [fileType, setFileType] = useState("all");
  const [folder, setFolder] = useState("all");
  const [minimumDegree, setMinimumDegree] = useState(0);
  const [changedOnly, setChangedOnly] = useState(false);
  const [cyclesOnly, setCyclesOnly] = useState(false);
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 560 });
  const drag = useRef<{ x: number; y: number; startX: number; startY: number; moved: boolean } | null>(null);
  const changedSet = useMemo(() => new Set(changedFiles), [changedFiles]);
  const cycles = useMemo(() => cyclicNodeIds(graph.nodes, graph.edges), [graph]);
  const fileNodes = useMemo(() => graph.nodes.filter((node) => node.kind === "file"), [graph.nodes]);
  const externalNodes = useMemo(() => {
    const seen = new Set<string>();
    return graph.nodes.filter((node) => {
      if (node.kind !== "module" || !node.external || seen.has(node.id)) return false;
      seen.add(node.id);
      return true;
    });
  }, [graph.nodes]);
  const folders = useMemo(() => [...new Set(fileNodes.map((node) => dir(node.path ?? "")))].sort(), [fileNodes]);
  const fileTypes = useMemo(() => [...new Set(fileNodes.map((node) => node.fileType ?? "unknown"))].sort(), [fileNodes]);

  const projected = useMemo(() => {
    const allowedFiles = new Set(fileNodes.filter((node) =>
      (fileType === "all" || node.fileType === fileType) && (folder === "all" || dir(node.path ?? "") === folder) &&
      (!changedOnly || changedSet.has(node.path ?? "")) && (!cyclesOnly || cycles.has(node.id)),
    ).map((node) => node.id));
    const degree = new Map<string, number>();
    for (const edge of graph.edges) { degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1); degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1); }
    let baseNodes: AnalysisNode[];
    let baseEdges: AnalysisEdge[];
    let eligibleIds: Set<string>;
    if (level === "folders") {
      const groups = new Map<string, AnalysisNode[]>();
      for (const node of fileNodes) { const key = dir(node.path ?? ""); groups.set(key, [...(groups.get(key) ?? []), node]); }
      baseNodes = [...groups].map(([path, members]) => ({ id: `folder:${path}`, kind: "module", name: path === "." ? "root" : path.split("/").at(-1)!, path, count: members.length } as AnalysisNode & { count: number }));
      eligibleIds = new Set([...groups].filter(([, members]) => members.some((node) => allowedFiles.has(node.id))).map(([path]) => `folder:${path}`));
      const groupOf = new Map<string, string>();
      for (const [path, members] of groups) for (const node of members) groupOf.set(node.id, `folder:${path}`);
      const edgeMap = new Map<string, AnalysisEdge>();
      for (const edge of graph.edges) {
        const source = groupOf.get(edge.source); const target = groupOf.get(edge.target);
        if (edge.kind !== "import" || !source || !target || source === target) continue;
        const id = `${source}->${target}`;
        if (!edgeMap.has(id)) edgeMap.set(id, { id, kind: "import", source, target, confidence: edge.confidence });
      }
      baseEdges = [...edgeMap.values()];
    } else if (level === "files") {
      baseNodes = [...fileNodes, ...externalNodes];
      eligibleIds = new Set([...allowedFiles, ...externalNodes.map((node) => node.id)]);
      const visible = new Set(baseNodes.map((node) => node.id));
      baseEdges = graph.edges.filter((edge) => edge.kind === "import" && visible.has(edge.source) && visible.has(edge.target));
    } else {
      baseNodes = graph.nodes.filter((node) => node.kind === "file" || node.kind === "function" || node.kind === "class");
      eligibleIds = new Set(baseNodes.filter((node) => node.kind === "file" ? allowedFiles.has(node.id) : allowedFiles.has(`file:${node.path}`)).map((node) => node.id));
      const valid = new Set(baseNodes.map((node) => node.id));
      baseEdges = graph.edges.filter((edge) => valid.has(edge.source) && valid.has(edge.target));
    }
    const uniqueNodes = new Map<string, AnalysisNode>();
    for (const node of baseNodes) if (!uniqueNodes.has(node.id)) uniqueNodes.set(node.id, node);
    baseNodes = [...uniqueNodes.values()];
    const search = query.trim().toLowerCase();
    const sortedBase = [...baseNodes].sort((a, b) => (a.path ?? a.name).localeCompare(b.path ?? b.name));
    const stableIndex = new Map(sortedBase.map((node, index) => [node.id, index]));
    const rows = sortedBase.filter((node) => eligibleIds.has(node.id) && ((degree.get(node.id) ?? 0) >= minimumDegree || level === "folders"))
      .sort((a, b) => (a.path ?? a.name).localeCompare(b.path ?? b.name));
    const cols = Math.max(3, Math.ceil(Math.sqrt(rows.length * 1.25)));
    const maxVisibleNodes = level === "symbols" ? 2200 : 2000;
    const truncated = rows.length > maxVisibleNodes || baseEdges.length > 18000;
    const visibleRows = rows.slice(0, maxVisibleNodes);
    const visibleIds = new Set(visibleRows.map((node) => node.id));
    const visibleEdges = baseEdges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)).slice(0, 18000);
    const positioned: PositionedNode[] = visibleRows.map((node) => {
      const index = stableIndex.get(node.id) ?? 0;
      const row = Math.floor(index / cols); const col = index % cols;
      const x = 110 + col * 175; const y = 90 + row * 92;
      return { ...node, x, y, degree: degree.get(node.id) ?? 0, count: (node as AnalysisNode & { count?: number }).count };
    });
    return { nodes: positioned, edges: visibleEdges, search, truncated };
  }, [graph, level, fileNodes, externalNodes, fileType, folder, changedOnly, changedSet, cyclesOnly, cycles, minimumDegree, query]);

  const indexed = useMemo(() => new Map(projected.nodes.map((node) => [node.id, node])), [projected.nodes]);
  const selected = indexed.get(selectedId ?? "") ?? projected.nodes.find((node) => node.id === selectedId) ?? null;
  const relatedIds = useMemo(() => {
    const result = new Set<string>();
    if (selected) { result.add(selected.id); for (const edge of projected.edges) if (edge.source === selected.id) result.add(edge.target); else if (edge.target === selected.id) result.add(edge.source); }
    return result;
  }, [selected, projected.edges]);
  const selectedSourceNode = graph.nodes.find((node) => node.id === selected?.id) ?? (selected?.path ? graph.nodes.find((node) => node.kind === "file" && node.path === selected.path) : undefined);
  const connectedEdges = selectedSourceNode ? graph.edges.filter((edge) => edge.source === selectedSourceNode.id || edge.target === selectedSourceNode.id) : [];
  const inbound = selectedSourceNode ? connectedEdges.filter((edge) => edge.target === selectedSourceNode.id) : projected.edges.filter((edge) => edge.target === selected?.id);
  const outbound = selectedSourceNode ? connectedEdges.filter((edge) => edge.source === selectedSourceNode.id) : projected.edges.filter((edge) => edge.source === selected?.id);
  const symbols = selectedSourceNode?.path
    ? graph.nodes.filter((node) => (node.kind === "function" || node.kind === "class") && node.path === selectedSourceNode.path)
    : [];
  const minimapBounds = useMemo(() => projected.nodes.reduce((value, node) => ({ minX: Math.min(value.minX, node.x), maxX: Math.max(value.maxX, node.x), minY: Math.min(value.minY, node.y), maxY: Math.max(value.maxY, node.y) }), { minX: 0, maxX: 1, minY: 0, maxY: 1 }), [projected.nodes]);
  const focusMinimapAt = (x: number, y: number) => {
    const worldX = minimapBounds.minX + x * (minimapBounds.maxX - minimapBounds.minX); const worldY = minimapBounds.minY + y * (minimapBounds.maxY - minimapBounds.minY);
    setViewport((current) => ({ ...current, x: canvasSize.width / 2 - worldX * current.scale, y: canvasSize.height / 2 - worldY * current.scale }));
  };
  const focusMinimap = (event: ReactPointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect(); focusMinimapAt((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
  };
  const onGraphKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (!projected.nodes.length) return;
    const currentIndex = projected.nodes.findIndex((node) => node.id === selectedId);
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (event.key === "Home" || event.key === "End") { event.preventDefault(); setSelectedId(projected.nodes[event.key === "Home" ? 0 : projected.nodes.length - 1]?.id ?? null); return; }
    if (delta) { event.preventDefault(); const index = currentIndex < 0 ? 0 : (currentIndex + delta + projected.nodes.length) % projected.nodes.length; setSelectedId(projected.nodes[index]?.id ?? null); }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const context = canvas.getContext("2d"); if (!context) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth; const height = canvas.clientHeight;
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) { canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); }
    context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, width, height);
    const theme = getComputedStyle(document.documentElement);
    const nodeColors = { file: theme.getPropertyValue("--graph-file").trim(), module: theme.getPropertyValue("--graph-module").trim(), function: theme.getPropertyValue("--graph-function").trim(), class: theme.getPropertyValue("--graph-entry").trim() };
    context.fillStyle = theme.getPropertyValue("--background").trim() || "#101820";
    context.fillRect(0, 0, width, height);
    context.save(); context.translate(viewport.x, viewport.y); context.scale(viewport.scale, viewport.scale);
    const coords = (node: PositionedNode) => ({ x: node.x, y: node.y });
    for (const edge of projected.edges) {
      const from = indexed.get(edge.source); const to = indexed.get(edge.target); if (!from || !to) continue;
      const hot = !selected || relatedIds.has(from.id) && relatedIds.has(to.id);
      context.globalAlpha = selected && !hot ? 0.12 : edge.confidence === "unknown" ? 0.45 : 0.7;
      context.strokeStyle = hot ? "#68a9ef" : "#78899a"; context.lineWidth = (hot ? 1.7 : 1) / viewport.scale;
      const a = coords(from); const b = coords(to); context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
      const angle = Math.atan2(b.y - a.y, b.x - a.x); const tip = { x: b.x - Math.cos(angle) * 36, y: b.y - Math.sin(angle) * 18 };
      context.fillStyle = context.strokeStyle; context.beginPath(); context.moveTo(tip.x, tip.y); context.lineTo(tip.x - Math.cos(angle - 0.45) * 7, tip.y - Math.sin(angle - 0.45) * 7); context.lineTo(tip.x - Math.cos(angle + 0.45) * 7, tip.y - Math.sin(angle + 0.45) * 7); context.closePath(); context.fill();
    }
    context.globalAlpha = 1;
    const showLabel = viewport.scale > 0.45;
    for (const node of projected.nodes) {
      const active = !selected || relatedIds.has(node.id); const widthNode = node.kind === "module" && node.id.startsWith("folder:") ? 130 : 142; const heightNode = 34;
      context.globalAlpha = active ? 1 : 0.27;
      const x = node.x - widthNode / 2; const y = node.y - heightNode / 2;
      context.beginPath(); context.roundRect(x, y, widthNode, heightNode, node.kind === "function" ? 17 : 8);
      context.fillStyle = selected?.id === node.id ? (theme.getPropertyValue("--primary-subtle").trim() || "#183552") : (theme.getPropertyValue("--surface").trim() || "#18232d"); context.fill();
      context.lineWidth = selected?.id === node.id ? 2 : 1; context.strokeStyle = selected?.id === node.id ? (theme.getPropertyValue("--primary").trim() || "#68a9ef") : nodeColors[node.kind] || nodeColors.module; context.stroke();
      context.fillStyle = nodeColors[node.kind] || nodeColors.module; context.beginPath(); context.arc(x + 13, node.y, 4, 0, Math.PI * 2); context.fill();
      if (showLabel) { context.fillStyle = theme.getPropertyValue("--foreground").trim() || "#dce5ed"; context.font = `${selected?.id === node.id ? "600 " : ""}11px ui-monospace, SFMono-Regular, Menlo, monospace`; context.textBaseline = "middle"; const text = node.name; context.fillText(text.length > 17 ? `${text.slice(0, 16)}…` : text, x + 23, node.y); }
      if (node.count) { context.fillStyle = "#93a4b2"; context.font = "10px sans-serif"; context.fillText(String(node.count), x + widthNode - 20, node.y); }
      if (projected.search && `${node.name} ${node.path ?? ""}`.toLowerCase().includes(projected.search)) { context.globalAlpha = 1; context.strokeStyle = "#dfb458"; context.lineWidth = 2; context.strokeRect(x - 3, y - 3, widthNode + 6, heightNode + 6); }
    }
    context.restore(); context.globalAlpha = 1;
  }, [projected, viewport, indexed, selected, relatedIds]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const observer = new ResizeObserver(() => setCanvasSize({ width: canvas.clientWidth, height: canvas.clientHeight }));
    observer.observe(canvas); return () => observer.disconnect();
  }, []);

  const fit = useCallback(() => {
    if (!projected.nodes.length) { setViewport({ scale: 1, x: 0, y: 0 }); return; }
    const bounds = projected.nodes.reduce((value, node) => ({ minX: Math.min(value.minX, node.x), maxX: Math.max(value.maxX, node.x), minY: Math.min(value.minY, node.y), maxY: Math.max(value.maxY, node.y) }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
    const { minX, maxX, minY, maxY } = bounds;
    const scale = Math.min(1.4, Math.max(0.22, Math.min((canvasSize.width - 90) / (maxX - minX + 170), (canvasSize.height - 100) / (maxY - minY + 110))));
    setViewport({ scale, x: (canvasSize.width - (minX + maxX) * scale) / 2, y: (canvasSize.height - (minY + maxY) * scale) / 2 });
  }, [projected.nodes, canvasSize]);
  useEffect(() => { const frame = requestAnimationFrame(fit); return () => cancelAnimationFrame(frame); }, [level, fileType, folder, changedOnly, cyclesOnly, minimumDegree, fit]);

  function onWheel(event: WheelEvent<HTMLCanvasElement>) {
    if (!event.ctrlKey && !event.metaKey) { setViewport((current) => ({ ...current, x: current.x - event.deltaX, y: current.y - event.deltaY })); return; }
    event.preventDefault(); setViewport((current) => ({ ...current, scale: Math.max(0.18, Math.min(2.4, current.scale * (event.deltaY < 0 ? 1.12 : 0.89))) }));
  }
  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    drag.current = { x: event.clientX, y: event.clientY, startX: viewport.x, startY: viewport.y, moved: false }; event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x; const dy = event.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
    setViewport((current) => ({ ...current, x: drag.current!.startX + dx, y: drag.current!.startY + dy }));
  }
  function onPointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const currentDrag = drag.current; drag.current = null; if (!currentDrag || currentDrag.moved) return;
    const rect = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - rect.left - viewport.x) / viewport.scale; const y = (event.clientY - rect.top - viewport.y) / viewport.scale;
    const hit = [...projected.nodes].reverse().find((node) => Math.abs(node.x - x) < 75 && Math.abs(node.y - y) < 23);
    setSelectedId(hit?.id ?? null);
  }
  function focusSearch() {
    const match = projected.nodes.find((node) => `${node.name} ${node.path ?? ""}`.toLowerCase().includes(query.toLowerCase().trim()));
    if (match) { setSelectedId(match.id); setViewport((current) => ({ ...current, x: canvasSize.width / 2 - match.x * current.scale, y: canvasSize.height / 2 - match.y * current.scale })); }
  }

  const openSource = selectedSourceNode?.path && htmlUrl && commit
    ? `${htmlUrl.replace(/\/$/, "")}/blob/${encodeURIComponent(commit)}/${selectedSourceNode.path.split("/").map(encodeURIComponent).join("/")}${selectedSourceNode.position ? `#L${selectedSourceNode.position.line}` : ""}`
    : null;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface" aria-label="Interactive architecture graph">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <label className="sr-only" htmlFor="graph-level">Graph detail</label>
        <select id="graph-level" value={level} onChange={(event) => setLevel(event.target.value as Level)} className="h-9 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus-ring">
          <option value="folders">Folders</option><option value="files">Files</option><option value="symbols">Functions & classes</option>
        </select>
        <label className="sr-only" htmlFor="graph-file-type">File type</label>
        <select id="graph-file-type" value={fileType} onChange={(event) => setFileType(event.target.value)} className="h-9 max-w-36 rounded-md border border-border bg-background px-2 text-xs text-foreground focus-ring"><option value="all">All file types</option>{fileTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select>
        <label className="sr-only" htmlFor="graph-folder">Folder</label>
        <select id="graph-folder" value={folder} onChange={(event) => setFolder(event.target.value)} className="h-9 max-w-44 rounded-md border border-border bg-background px-2 text-xs text-foreground focus-ring"><option value="all">All folders</option>{folders.map((path) => <option key={path}>{path}</option>)}</select>
        <label className="flex h-9 items-center gap-1.5 rounded-md border border-border px-2 text-xs text-foreground-secondary"><input type="checkbox" checked={changedOnly} disabled={!changedFiles.length} onChange={(event) => setChangedOnly(event.target.checked)} />Changed</label>
        <label className="flex h-9 items-center gap-1.5 rounded-md border border-border px-2 text-xs text-foreground-secondary"><input type="checkbox" checked={cyclesOnly} onChange={(event) => setCyclesOnly(event.target.checked)} />Cycles</label>
        <label className="flex items-center gap-2 rounded-md border border-border px-2 text-xs text-foreground-secondary" title="Minimum direct relationships"><span>Density</span><input type="range" min="0" max="8" value={minimumDegree} onChange={(event) => setMinimumDegree(Number(event.target.value))} className="w-16 accent-primary" /><span>{minimumDegree}+</span></label>
        <form className="ml-auto flex h-9 min-w-36 flex-1 items-center gap-1 rounded-md border border-border bg-background px-2 sm:max-w-60" onSubmit={(event) => { event.preventDefault(); focusSearch(); }}><Search className="size-3.5 shrink-0 text-foreground-tertiary" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a node" aria-label="Find a node" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-foreground-tertiary" />{query ? <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X className="size-3.5" /></button> : null}</form>
      </div>
    <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="relative min-w-0 border-b border-border lg:border-r lg:border-b-0">
          <div className="absolute top-3 left-3 z-10 flex gap-1 rounded-md border border-border bg-surface/95 p-1 shadow-sm">
            <button type="button" aria-label="Zoom in" onClick={() => setViewport((view) => ({ ...view, scale: Math.min(2.4, view.scale * 1.2) }))} className="grid size-7 place-items-center rounded hover:bg-surface-hover focus-ring"><Plus className="size-4" /></button>
            <button type="button" aria-label="Zoom out" onClick={() => setViewport((view) => ({ ...view, scale: Math.max(0.18, view.scale / 1.2) }))} className="grid size-7 place-items-center rounded hover:bg-surface-hover focus-ring"><Minus className="size-4" /></button>
            <button type="button" aria-label="Fit graph to view" onClick={fit} className="grid size-7 place-items-center rounded hover:bg-surface-hover focus-ring"><Maximize2 className="size-3.5" /></button>
          </div>
          <div className="absolute top-3 right-3 z-10 rounded-md border border-border bg-surface/95 px-2 py-1 text-[10px] text-foreground-tertiary">{projected.nodes.length.toLocaleString()} nodes · {projected.edges.length.toLocaleString()} edges{projected.truncated ? " · showing bounded subgraph" : ""}</div>
          {projected.nodes.length ? <canvas ref={canvasRef} tabIndex={0} className="h-[min(68vh,680px)] min-h-[420px] w-full cursor-grab touch-none active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-primary" aria-label="Dependency graph. Use arrow keys to select nodes, pointer to pan and select, and trackpad pinch or control plus scroll to zoom." onKeyDown={onGraphKeyDown} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { drag.current = null; }} /> : <div className="grid h-[min(68vh,680px)] min-h-[420px] place-items-center px-6 text-center"><div><Folder className="mx-auto size-7 text-foreground-tertiary" /><h3 className="mt-2 text-sm font-medium">No nodes match these filters</h3><p className="mt-1 text-xs text-foreground-secondary">Adjust the folder, file type, change, cycle, or dependency filters.</p></div></div>}
          <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-md border border-border bg-surface/95 px-2.5 py-1.5 text-[10px] text-foreground-secondary"><span className="flex items-center gap-1"><FileCode2 className="size-3 text-graph-file" />File</span><span className="flex items-center gap-1"><Circle className="size-2.5 fill-graph-function text-graph-function" />Function</span><span className="flex items-center gap-1"><Folder className="size-3 text-graph-module" />Folder</span></div>
          <div className="absolute right-3 bottom-3 hidden h-20 w-32 overflow-hidden rounded border border-border bg-background/90 p-1 sm:block" aria-label="Graph minimap"><svg viewBox="0 0 100 60" className="size-full cursor-crosshair" role="img" tabIndex={0} aria-label="Minimap; select a point to center the graph there" onPointerDown={focusMinimap} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); focusMinimapAt(0.5, 0.5); } }}><title>Graph overview</title>{projected.edges.slice(0, 600).map((edge) => { const a = indexed.get(edge.source); const b = indexed.get(edge.target); if (!a || !b) return null; const width = Math.max(1, minimapBounds.maxX - minimapBounds.minX); const height = Math.max(1, minimapBounds.maxY - minimapBounds.minY); return <line key={edge.id} x1={(a.x - minimapBounds.minX) / width * 96 + 2} y1={(a.y - minimapBounds.minY) / height * 56 + 2} x2={(b.x - minimapBounds.minX) / width * 96 + 2} y2={(b.y - minimapBounds.minY) / height * 56 + 2} className="stroke-graph-dependency/50" strokeWidth=".5" />; })}{projected.nodes.map((node) => { const width = Math.max(1, minimapBounds.maxX - minimapBounds.minX); const height = Math.max(1, minimapBounds.maxY - minimapBounds.minY); return <circle key={node.id} cx={(node.x - minimapBounds.minX) / width * 96 + 2} cy={(node.y - minimapBounds.minY) / height * 56 + 2} r="1" className={node.kind === "file" ? "fill-graph-file" : node.kind === "function" ? "fill-graph-function" : "fill-graph-module"} />; })}</svg></div>
        </div>
        <aside className="max-h-[680px] overflow-y-auto p-4" aria-live="polite">
          {selected ? <>
            <div className="flex items-start gap-2"><span className={cn("mt-1 size-2.5 shrink-0 rounded-full", selected.kind === "file" ? "bg-graph-file" : selected.kind === "function" ? "bg-graph-function" : "bg-graph-module")} /><div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-wide text-foreground-tertiary">{selected.external ? "External dependency" : label[selected.kind] ?? "Node"}{selected.exported ? " · exported" : ""}</p><h2 className="mt-1 break-words font-mono text-sm font-semibold text-foreground">{selected.name}</h2><p className="mt-1 break-all font-mono text-[11px] leading-4 text-foreground-secondary">{selected.path ?? "Outside repository"}{selected.position ? `:${selected.position.line}:${selected.position.column}` : ""}</p></div></div>
            {selected.kind === "module" && selected.id.startsWith("folder:") ? <p className="mt-3 text-xs text-foreground-secondary">Aggregated folder · {selected.count} files</p> : null}
            <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-md bg-background-subtle p-2.5"><p className="text-[10px] text-foreground-tertiary">Incoming</p><p className="mt-1 text-lg font-semibold tabular-nums">{inbound.length}</p></div><div className="rounded-md bg-background-subtle p-2.5"><p className="text-[10px] text-foreground-tertiary">Outgoing</p><p className="mt-1 text-lg font-semibold tabular-nums">{outbound.length}</p></div></div>
            {symbols.length ? <div className="mt-4 border-t border-border pt-3"><h3 className="text-xs font-medium">Symbols in this file <span className="font-normal text-foreground-tertiary">({symbols.length})</span></h3><ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">{symbols.map((symbol) => <li key={symbol.id} className="flex items-baseline justify-between gap-2 text-[11px]"><span className="truncate font-mono text-foreground">{symbol.name}</span><span className="shrink-0 text-foreground-tertiary">{symbol.kind}{symbol.exported ? " · exported" : ""}{symbol.position ? ` · L${symbol.position.line}` : ""}</span></li>)}</ul></div> : null}
            {commit ? <div className="mt-4 border-t border-border pt-3"><p className="text-[10px] font-medium uppercase tracking-wide text-foreground-tertiary">Analyzed commit</p><p className="mt-1 font-mono text-xs">{commit.slice(0, 12)}</p>{commitSubject ? <p className="mt-1 text-xs text-foreground-secondary">{commitSubject}</p> : null}</div> : null}
            {selectedSourceNode && htmlUrl && commit ? <a href={openSource ?? undefined} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border text-xs font-medium hover:bg-surface-hover focus-ring">Open source on GitHub <ArrowUpRightIcon /></a> : null}
            <RelationList title="Depends on" edges={outbound} nodeMap={new Map(graph.nodes.map((node) => [node.id, node]))} />
            <RelationList title="Used by" edges={inbound} nodeMap={new Map(graph.nodes.map((node) => [node.id, node]))} />
          </> : <div className="grid min-h-72 place-items-center text-center"><div><Circle className="mx-auto size-6 text-foreground-tertiary" /><h2 className="mt-3 text-sm font-medium">Select a node</h2><p className="mt-1 text-xs text-foreground-secondary">Choose a file or folder to inspect its direct relationships.</p></div></div>}
        </aside>
      </div>
      {commitSubject ? <div className="border-t border-border px-3 py-2 text-[11px] text-foreground-tertiary">Latest commit: {commitSubject} · {commit?.slice(0, 12)}</div> : null}
    </section>
  );
}

function ArrowUpRightIcon() { return <ArrowUp className="size-3.5" />; }
function RelationList({ title, edges, nodeMap }: { title: string; edges: AnalysisEdge[]; nodeMap: Map<string, AnalysisNode> }) {
  return <div className="mt-4 border-t border-border pt-3"><h3 className="text-xs font-medium">{title} <span className="font-normal text-foreground-tertiary">({edges.length})</span></h3>{edges.length ? <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">{edges.slice(0, 40).map((edge) => { const node = nodeMap.get(title === "Depends on" ? edge.target : edge.source); return <li key={edge.id} className="flex min-w-0 items-center justify-between gap-2 text-[11px]"><span className="truncate font-mono text-foreground-secondary" title={node?.path ?? node?.name}>{node?.path ?? node?.name ?? edge.specifier}</span><span className={cn("shrink-0", edge.confidence === "unknown" ? "text-warning" : "text-foreground-tertiary")}>{edge.confidence === "unknown" ? "unresolved" : edge.kind}</span></li>; })}</ul> : <p className="mt-1 text-[11px] text-foreground-tertiary">No direct relationships.</p>}</div>;
}
