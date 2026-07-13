# Sigil — Trust Anchor & Execution Adapters

> Midnight is Sigil's trust anchor, not merely its first backend. Applications on other chains anchor *into* Midnight through Sigil.

See also [PRD §18](PRD.md#18-trust-anchor--execution-layers). This document specifies the backend interface and the two backend roles.

## 1. The backend interface

```ts
interface Backend {
  commit(items: ProvenanceItem[]): Promise<Receipt[]>;
  query(filter: QueryFilter): Promise<ProvenanceItem[]>;
  verify(receipt: Receipt): Promise<VerificationResult>;
  disclose(request: DisclosureRequest): Promise<DisclosureReceipt>;
  revoke(attestationId: AttestationId): Promise<Receipt>;
}
```

Two distinct roles implement this interface:

- **Anchor** — *where trust is rooted*: Midnight.
- **Adapter** — *where applications connect*: execution chains and local storage.

## 2. Midnight — the Trust Anchor

Provides:

- **Commitment anchoring** for Merkle roots and Pedersen commitments.
- **Zero-knowledge proof** generation and verification for selective disclosure.
- **Compact circuits** compiled from disclosure policies.

Policy → circuit compilation: `reveal` → value-matches-commitment constraint; `hash` → correct-hash constraint; `redact` → no constraint. One ZK proof attests all rules applied exactly.

Config: `MidnightConfig { network: "testnet"|"mainnet"; walletPath?; indexerUrl?; proofServerUrl? }`.

*Status:* `@sigil/backend-midnight` and the `compact` package are empty scaffolding — planned (v0.3). See [RFC 0003](RFC/0003-midnight-adapter.md).

## 3. Execution / Interoperability adapters

Each generates provenance locally and anchors into Midnight; none is an independent root of trust.

| Adapter | Role | Status |
|---|---|---|
| Ethereum | EVM public anchoring/mirroring | planned (v0.5) |
| Solana | high-throughput app substrate | planned (v0.5) |
| Cardano | UTXO anchoring/mirroring | planned (v0.5) |
| Avalanche | subnet/app-chain integration | planned (v0.5) |
| Hyperledger | enterprise/permissioned | planned (v0.5) |

## 4. Local backend

`@sigil/backend-local` — **shipping**. Stores all provenance in the SQLite graph store. Implements `commit` (hashes JSON, dispatches by type, returns a `Receipt` with `ProofType.None`), `query` (asset-centric, optional issuer filter), `disclose` (uses the policy engine's `getVisibleFields` when provided), `revoke` (sets attestation status → revoked), and `verify` (checks the receipt against committed state — the referenced entity must exist — and returns the provenance chain for assets). Cryptographic integrity (Merkle/ZK) verification is layered in at the Midnight anchor.

## 5. Mock backend

A deterministic in-memory backend for unit tests and examples, exercising the same five-method interface with no side effects.

## 6. Authoring a new adapter

1. Implement the `Backend` interface from `@sigil/core`.
2. Map `commit` to your anchor/mirror mechanism and return `Receipt`s with the appropriate `ProofType`.
3. Implement `verify` against your anchor.
4. For confidential disclosure, delegate `disclose` proof generation to the Midnight anchor.
5. Register the adapter and select it via `SigilConfig.backend`.
