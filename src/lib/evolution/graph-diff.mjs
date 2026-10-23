export function compareGraphSnapshots(base, head) {
  const baseNodes = new Map((base?.nodes ?? []).map((node) => [node.id, node]));
  const headNodes = new Map((head?.nodes ?? []).map((node) => [node.id, node]));
  const edgeId = (edge) => edge.id ?? `${edge.kind}:${edge.source}->${edge.target}`;
  const baseEdges = new Map((base?.edges ?? []).map((edge) => [edgeId(edge), edge]));
  const headEdges = new Map((head?.edges ?? []).map((edge) => [edgeId(edge), edge]));
  const addedNodes = [...headNodes].filter(([id]) => !baseNodes.has(id)).map(([, node]) => node);
  const removedNodes = [...baseNodes].filter(([id]) => !headNodes.has(id)).map(([, node]) => node);
  const addedEdges = [...headEdges].filter(([id]) => !baseEdges.has(id)).map(([, edge]) => edge);
  const removedEdges = [...baseEdges].filter(([id]) => !headEdges.has(id)).map(([, edge]) => edge);
  return {
    addedNodesCount: addedNodes.length,
    removedNodesCount: removedNodes.length,
    addedEdgesCount: addedEdges.length,
    removedEdgesCount: removedEdges.length,
    addedNodes: addedNodes.slice(0, 100),
    removedNodes: removedNodes.slice(0, 100),
    addedEdges: addedEdges.slice(0, 100),
    removedEdges: removedEdges.slice(0, 100),
    truncated: addedNodes.length > 100 || removedNodes.length > 100 || addedEdges.length > 100 || removedEdges.length > 100,
  };
}
