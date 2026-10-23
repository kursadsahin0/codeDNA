# ADR 0001: Render the architecture graph on a canvas

- Status: Accepted
- Date: 2026-10-21

## Context

Architecture exploration needs stable positions, directional edges, keyboard navigation, filtering, and bounded rendering for dense repositories. A DOM node per graph item would make large maps expensive and hard to keep visually stable.

## Decision

Use the existing custom Canvas 2D renderer for the overview graph, with normalized analysis data kept separate from drawing. Keep selection, search, detail level, keyboard traversal, and a textual detail panel in the React UI. The renderer caps the visible subgraph and reduces density at folder level.

## Consequences

The renderer avoids thousands of DOM nodes and keeps pan/zoom responsive. Canvas does not expose each node to assistive technology, so keyboard navigation and the adjacent semantic detail panel remain required. New graph interactions must preserve those paths. Revisit a graph library if requirements expand to editable graphs or complex node layouts.
