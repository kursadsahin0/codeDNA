# ADR 0002: Use the TypeScript Compiler API for JavaScript and TypeScript

- Status: Accepted
- Date: 2026-10-21

## Context

CodeDNA needs source locations and a normalized graph for TS/JS without executing untrusted repository code. Import relationships must remain distinct from calls.

## Decision

Parse bounded JavaScript and TypeScript source with the TypeScript Compiler API. Normalize file, module, function, and class nodes plus import, export, and only locally resolvable call edges. Mark unresolved imports and parser diagnostics explicitly. Do not install packages or run repository scripts.

## Consequences

The parser shares TypeScript's syntax support and produces useful source spans. It does not model runtime dispatch, reflection, generated files, or all cross-file calls; import graphs are not guarantees of runtime impact. Inputs are bounded by size and file-count limits, and unsupported or malformed files are reported rather than silently treated as complete.
