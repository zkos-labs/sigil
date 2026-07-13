# RFC 0002 — Plugin API

- **Status:** Draft
- **Authors:** ZKOS Labs
- **Related:** [PLUGINS.md](../PLUGINS.md), [PRD §17](../PRD.md#17-plugin-architecture)

## Summary

Define a stable registration and lifecycle contract for Sigil's eight plugin categories (Storage, Backend, Identity, Policy, Proof, Evidence, Visualization, Query).

## Motivation

Today plugins are wired ad hoc via `SigilConfig` (`crypto`, `graph`, `policy`) and backend selection. To enable a marketplace of interchangeable components, we need a uniform registration API, discovery, and versioned capability negotiation that keeps `@sigil/core` interfaces authoritative.

## Design sketch

- A `PluginRegistry` with `register(category, impl, meta)` and typed lookup.
- Each category keyed to its `@sigil/core` interface (`GraphStore`, `Backend`, `CryptoProvider`, `PolicyEngine`, plus proof/evidence/visualization/query interfaces to be finalized).
- Capability metadata (`name`, `version`, supported features) for negotiation.
- Deterministic ordering/merging where multiple plugins of a category coexist (e.g. policy composition).

## Alternatives considered

- Config-only wiring (current) — insufficient for third-party discovery.
- Dependency-injection framework — heavier than needed for a library-first design.

## Open questions

- Finalize the Proof, Evidence, Visualization, and Query interfaces (currently informal).
- Trust/certification model for third-party plugins that participate in verification.
- Versioning/compatibility policy across `@sigil/core` releases.
