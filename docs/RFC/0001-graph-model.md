# RFC 0001 — Provenance Graph Model

- **Status:** Draft
- **Authors:** ZKOS Labs
- **Related:** [GRAPH_MODEL.md](../GRAPH_MODEL.md), [PRD §13](../PRD.md#13-provenance-graph-model)

## Summary

Specify Sigil's provenance graph model and define the migration from the current fixed relational schema (asset/event/claim/attestation) to a generalized node/edge graph store.

## Motivation

The shipping `SqliteGraphStore` models provenance as four fixed tables and links claims to assets by `claim.subject === assetId`. This cannot express arbitrary edges (`derivedFrom`, `composedOf`, multi-asset lineage) that the model in [GRAPH_MODEL.md](../GRAPH_MODEL.md) calls for. We need a general graph without breaking `@sigil/core` contracts or existing traversal behavior.

## Design sketch

- Introduce `nodes(id, kind, data)` and `edges(from, to, type, data)` tables behind the existing `GraphStore` interface.
- Preserve `traverse(assetId) → ProvenanceChain` semantics as a view over the general graph.
- Define canonical edge types and their invariants (acyclicity where required).
- Provide a migration from the 4-table schema; keep DOT/JSON-LD exporters working.

## Alternatives considered

- Keep the relational schema and special-case each new edge type (rejected: does not scale).
- Adopt an embedded graph database (deferred: adds a heavy dependency vs. SQLite-first goal).

## Open questions

- How are edges signed/anchored independently of nodes?
- What indexing supports large-graph traversal within the [performance targets](../PRD.md#performance-targets)?
- Migration story for on-disk stores created by v0.1.
