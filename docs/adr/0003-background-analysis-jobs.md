# ADR 0003: Queue repository analysis outside web requests

- Status: Accepted
- Date: 2026-10-21

## Context

Downloading a repository tree and parsing source can exceed normal request budgets. Analysis must not block the UI request or execute repository code.

## Decision

Persist user-scoped analysis jobs in Supabase/PostgreSQL. A private Node worker claims queued work atomically with `FOR UPDATE SKIP LOCKED`, reports progress, and retries bounded failures. The web app returns a job identifier and status; it does not run analysis inline.

## Consequences

Web requests remain short and multiple workers can share a queue. Production needs an always-on private worker, database availability, and monitoring for stalled/retried jobs. When no worker is configured, jobs remain queued and the UI must say so. Credentials are server-only; job and result lookups include the authenticated user and repository grant.
