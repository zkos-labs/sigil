# Sigil — Confidential Backends, Settlement & Execution Adapters

> Sigil owns the provenance model, trust graph, attestation schema, and selective-disclosure logic. Confidential networks are **interchangeable backends** beneath a single interface — Sigil is not synonymous with any one of them.

See also [PRD §18](PRD.md#18-confidential-execution--interoperability-layers). This document specifies the backend interface and the three roles that implement or surround it.

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

Three distinct roles surround it:

- **Confidential backend** — *where private state is computed and proofs are generated*: Aztec (active), Midnight (on hold).
- **Settlement** — *where the confidential backend's state and proofs land*: Ethereum.
- **Execution / interoperability adapter** — *where applications connect*: execution chains and local storage.

Ethereum appears in two of these roles and they should not be conflated. As **settlement** it sits beneath Aztec. As an **execution adapter** it is one substrate among several on which an application may run.

## 2. Aztec — the confidential backend (active)

Provides:

- **Commitment anchoring** for Merkle roots and Pedersen commitments — private notes for confidential provenance, public contract state for anchors that must be independently observable.
- **Zero-knowledge proof** generation and verification for selective disclosure, proved **client-side in the PXE** (Private Execution Environment), so private provenance never leaves the holder's machine to reach a third-party prover.
- **Noir circuits** (Aztec.nr contracts) compiled from disclosure policies.
- **Ethereum settlement**, which gives disclosures an L1-verifiable path and access to established identity and attestation standards.

Policy → circuit compilation: `reveal` → value-matches-commitment constraint; `hash` → correct-hash constraint; `redact` → no constraint. One ZK proof attests all rules applied exactly. Receipts carry `ProofType.AztecZk`.

Config: `AztecConfig { network: "sandbox"|"testnet"|"mainnet"; pxeUrl?; l1RpcUrl?; accountAddress? }`.

*Status:* `@sigil/backend-aztec` and the `noir` package do not exist yet — planned (v0.3). See [RFC 0005](RFC/0005-aztec-adapter.md).

## 3. Midnight — deferred alternate backend (on hold)

Midnight's data-protection-first design maps cleanly onto Sigil: public/private state separation, native selective disclosure, and automatic Kachina-based proof generation. Policies would compile to **Compact circuit constraints** under the same `reveal`/`hash`/`redact` mapping, and receipts would carry `ProofType.MidnightZk`.

Config: `MidnightConfig { network: "testnet"|"mainnet"; walletPath?; indexerUrl?; proofServerUrl? }`.

*Status:* **on hold.** The design is kept, not discarded — the network's developer ecosystem, wallets, and identity/attestation integrations are less mature than Ethereum's today. Revisit at v0.6+. See [RFC 0003](RFC/0003-midnight-adapter.md).

Keeping a second specified backend is the point: it is what makes the confidential layer pluggable in fact rather than in claim.

## 4. Execution / Interoperability adapters

Each generates provenance locally and commits it through the active confidential backend; none is an independent root of trust.

| Adapter | Role | Status |
|---|---|---|
| Ethereum | EVM public anchoring/mirroring (distinct from its settlement role above) | planned (v0.5) |
| Solana | high-throughput app substrate | planned (v0.5) |
| Cardano | UTXO anchoring/mirroring | planned (v0.5) |
| Avalanche | subnet/app-chain integration | planned (v0.5) |
| Hyperledger | enterprise/permissioned | planned (v0.5) |

An application native to any of these gains confidential provenance without that chain needing confidential smart contracts of its own.

## 5. Local backend

`@sigil/backend-local` — **shipping**. Stores all provenance in the SQLite graph store. Implements `commit` (hashes JSON, dispatches by type, returns a `Receipt` with `ProofType.None`), `query` (asset-centric, optional issuer filter), `disclose` (uses the policy engine's `getVisibleFields` when provided), `revoke` (sets attestation status → revoked), and `verify` (checks the receipt against committed state — the referenced entity must exist — and returns the provenance chain for assets). Cryptographic integrity (Merkle/ZK) verification is layered in by the confidential backend.

## 6. Mock backend

A deterministic in-memory backend for unit tests and examples, exercising the same five-method interface with no side effects.

## 7. Authoring a new adapter

1. Implement the `Backend` interface from `@sigil/core`.
2. Map `commit` to your anchor/mirror mechanism and return `Receipt`s with the appropriate `ProofType`.
3. Implement `verify` against your anchor.
4. For confidential disclosure, delegate `disclose` proof generation to the active confidential backend.
5. Register the adapter and select it via `SigilConfig.backend` (`BackendName`).
