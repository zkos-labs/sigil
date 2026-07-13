# Sigil — Provenance Graph Model

This document specifies Sigil's provenance data model. Schemas are normative and mirror `@sigil/core`. See also [PRD §13–14](PRD.md#13-provenance-graph-model).

## 1. Entities

Five node types capture an object's full lifecycle:

- **Asset** — the object whose provenance is tracked.
- **Event** — a discrete, append-only occurrence in an asset's lifecycle.
- **Claim** — a signed `(subject, predicate, object)` assertion.
- **Attestation** — a third-party counter-signature affirming/disputing a claim.
- **Evidence** — content-addressed data supporting a claim.

## 2. Schemas

```ts
interface Asset {
  id: AssetId; type: string; owner: DID;
  metadata: Record<string, unknown>;
  visibility: VisibilityLevel; createdAt: Timestamp;
}

interface Event {
  id: EventId; assetId: AssetId; type: string;   // created|transferred|certified|inspected|revoked|updated|custom
  issuer: DID; timestamp: Timestamp; proof: Proof;
  metadata?: Record<string, unknown>;
}

interface Claim {
  id: ClaimId; subject: string; predicate: string; object: string;
  issuer: DID; signature: Signature; proof: Proof;
  visibility: VisibilityLevel; evidence?: Evidence[];
}

interface Attestation {
  id: AttestationId; claimId: ClaimId; issuer: DID;
  proof: Proof; status: AttestationStatus;        // active|revoked|expired
  expiresAt?: Timestamp;
}

interface Evidence {
  type: EvidenceType;                             // zk-proof|pdf|ipfs-cid|sensor-data|signature|external-ref|image
  value: string; metadata?: Record<string, unknown>;
}
```

## 3. Relationships (edges)

| Edge | From → To | Meaning |
|---|---|---|
| `has` | Asset → Event | an asset accrues lifecycle events |
| `references` | Event → Claim | an event carries signed assertions |
| `attestedBy` | Claim → Attestation | a third party affirms/disputes a claim |
| `supports` | Evidence → Claim | evidence backs a claim |
| `derivedFrom` | Asset → Asset | derivation lineage |
| `composedOf` | Asset → Asset[] | aggregation/composition |

## 4. Event sourcing

An asset's state at time *t* is the ordered set of its events with timestamp ≤ *t*. Events are append-only; corrections are new events referencing predecessors. Properties: **immutability** (tamper-evident), **replayability** (reconstruct from genesis), **auditability** (every transition is signed).

## 5. Graph semantics

Modeled as a directed graph `G = (V, E)`. Enables: reverse lineage (inputs → origin), forward impact analysis (all assets affected by a compromised component), and predicate-filtered traversal (every node on a certification path has a valid attestation).

## 6. Traversal

`GraphStore.traverse(assetId)` returns a `ProvenanceChain { asset, events[], claims[], attestations[] }`. Current implementation links claims to an asset when `claim.subject === assetId`; a generalized node/edge store with arbitrary edges is planned ([RFC 0001](RFC/0001-graph-model.md)).

## 7. W3C PROV mapping

| Sigil | PROV |
|---|---|
| Asset | Entity |
| Event | Activity |
| Claim / Attestation | attribution / qualified association |
| issuer (DID) | Agent |

Sigil extends PROV with cryptographic anchoring, event-sourcing semantics, and policy-driven disclosure that PROV leaves unspecified.

## 8. Versioning & temporal queries

Updates are new versioned events referencing predecessors. Point-in-time reconstruction and `since`/`until` interval queries are supported by the model; full filter honoring in the query engine is planned (see [PRD §12.9](PRD.md#129-current-implementation-status)).
