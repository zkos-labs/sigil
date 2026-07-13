# Sigil — API Specifications

Sigil's network APIs are **planned**; the SDK ([SDK.md](SDK.md)) is the current entry point. This document sketches the intended REST, GraphQL, gRPC, and streaming surfaces. All shapes derive from `@sigil/core`. See also [PRD §23](PRD.md#23-apis).

## 1. REST (planned)

Resource-oriented over the core entities.

```http
POST /v1/assets                      # create asset       → Asset
GET  /v1/assets/{id}                 # get asset          → Asset
POST /v1/assets/{id}/events          # record event       → Event
POST /v1/claims                      # make claim         → Claim
POST /v1/attestations                # attest a claim     → Attestation
POST /v1/attestations/{id}/revoke    # revoke             → Receipt
GET  /v1/assets/{id}/graph           # traverse           → ProvenanceChain
POST /v1/assets/{id}/verify          # verify             → VerificationResult
POST /v1/assets/{id}/disclose        # selective disclose → DisclosureReceipt
```

Disclosure requests carry `{ recipient, level, fields }` and return a proof-bearing `DisclosureReceipt`.

## 2. GraphQL (planned)

Graph-shaped, ideal for lineage/traversal.

```graphql
type Query {
  asset(id: ID!): Asset
  provenance(assetId: ID!): ProvenanceChain
  verify(assetId: ID!): VerificationResult
}
type Mutation {
  createAsset(input: CreateAssetInput!): Asset
  recordEvent(input: RecordEventInput!): Event
  makeClaim(input: MakeClaimInput!): Claim
  attest(claimId: ID!): Attestation
  disclose(input: DiscloseInput!): DisclosureReceipt
  revoke(attestationId: ID!): Receipt
}
```

## 3. gRPC (planned)

Strongly-typed service for service-to-service integration and the future Rust core, mirroring the `Backend` interface (`commit`, `query`, `verify`, `disclose`, `revoke`) plus SDK-level convenience methods.

## 4. Event streaming & webhooks (planned)

- **Streaming:** subscribe to provenance events (new claims, attestations, revocations, disclosures).
- **Webhooks:** outbound notifications on provenance changes for external workflow integration.

## 5. Common types

All endpoints exchange the `@sigil/core` types: `Asset`, `Event`, `Claim`, `Attestation`, `Evidence`, `Receipt`, `DisclosureReceipt`, `VerificationResult`, `ProvenanceChain`, `QueryFilter`. See [GRAPH_MODEL.md](GRAPH_MODEL.md).
