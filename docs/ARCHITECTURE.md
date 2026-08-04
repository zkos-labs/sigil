# Sigil — Architecture

> Sigil is a multichain zero-knowledge provenance layer with a pluggable confidential execution layer. Applications running on Ethereum, Solana, Cardano, or other ecosystems can generate verifiable provenance through Sigil, while a confidential backend — Aztec today, Midnight on hold — handles commitments, selective disclosure, and zero-knowledge verification.

This document describes Sigil's system architecture. For product vision see [PRD.md](PRD.md); for the data model see [GRAPH_MODEL.md](GRAPH_MODEL.md).

## 1. Layered overview

```text
               Applications          AI · ESG · Supply Chain · Identity · DeSci
────────────────────────────────────
             Sigil SDK               High-level API · CLI · language bindings
────────────────────────────────────
        Sigil Core Engine            Graph Engine · Disclosure Engine · Proof Engine
────────────────────────────────────
        Backend Interface            commit · query · verify · disclose · revoke
────────────────────────────────────
   Confidential Execution            ⭐ Aztec (active) · Midnight (on hold)
────────────────────────────────────
        Settlement                   Ethereum
────────────────────────────────────
   Execution / Interoperability      Ethereum · Solana · Cardano · Avalanche · Hyperledger · Local
────────────────────────────────────
      Infrastructure                 Daemon · IPFS · Identity Providers
```

Each layer depends only on the interface of the layer below it. The invariant that defines the architecture is **not** any one network: Sigil owns the provenance model, trust graph, attestation schema, and selective-disclosure logic, and confidential networks are interchangeable beneath the backend interface.

Ethereum appears twice, in two distinct roles: as **settlement**, where the confidential backend's state and proofs land; and as one **execution adapter** among several, where an EVM-native application may run.

## 2. Core engine subsystems

| Subsystem | Package | Responsibility |
|---|---|---|
| **Graph Engine** | `@sigil/graph` | Event-sourced storage and traversal of assets, events, claims, attestations. |
| **Disclosure Engine** | `@sigil/policy` | Parse and evaluate disclosure policies; drive proof-carrying disclosure. |
| **Proof Engine** | `@sigil/crypto` (+ backend) | Hashing, Ed25519, `did:sigil`, Merkle trees; ZK proof gen/verify in the confidential backend. |

The engine is composed from the plugin interfaces defined in `@sigil/core`: `GraphStore`, `CryptoProvider`, `PolicyEngine`, and `Backend`.

## 3. The backend interface

Every backend — confidential, execution, or local — implements five methods:

```ts
interface Backend {
  commit(items: ProvenanceItem[]): Promise<Receipt[]>;
  query(filter: QueryFilter): Promise<ProvenanceItem[]>;
  verify(receipt: Receipt): Promise<VerificationResult>;
  disclose(request: DisclosureRequest): Promise<DisclosureReceipt>;
  revoke(attestationId: AttestationId): Promise<Receipt>;
}
```

Provenance and policy logic call only this interface, so new confidential backends and chains are added without touching the engine.

## 4. Trust boundaries

Guaranteed cryptographically (independent of any backend's honesty):

- Signature validity of claims/events/attestations (Ed25519).
- Tamper-evidence of event history (event sourcing + hashing).
- Merkle inclusion of events and claims.
- Policy-faithful selective disclosure (ZK proof in the confidential backend).

Outside the cryptographic boundary (documented assumptions):

- Truthfulness of claim *content* — Sigil verifies signatures, not facts.
- Backend network liveness.
- Private-key secrecy.
- Policy *enforcement* on non-ZK backends (depends on that backend's integrity).

## 5. The anchor pattern

```text
Application (any chain)
      │  generate provenance locally via Sigil
      ▼
Sigil Core Engine ──► Backend.commit ──► ⭐ Aztec  (commitment, ZK proof)
      ▲                                        │        │
      │                                        │        ▼
      │                                        │    Ethereum (settlement)
      └──────────── commitment + proof ◄───────┘
```

A Solana- or Ethereum-native application gains confidential provenance without its own chain needing confidential smart contracts. Swapping Aztec for another confidential backend changes the box, not the pattern.

## 6. Data-flow sequences

**Write:** `SDK.createAsset/recordEvent/makeClaim` → sign (Ed25519) → append to Graph Engine → compute hashes/Merkle roots → `Backend.commit` (anchor) → return `Receipt`.

**Disclose:** viewer requests fields → Disclosure Engine evaluates `Policy` (default-deny) → Proof Engine (confidential backend; on Aztec, client-side in the PXE) generates `Π_ZK` over disclosed fields + Merkle root → return `DisclosureReceipt`.

**Verify:** recompute hashes → check signatures → verify Merkle inclusion → verify ZK proof against the anchored root → return `VerificationResult`. No step trusts Sigil's own infrastructure.

## 7. Deployment topologies

Embedded library (SDK + SQLite) · standalone server · cloud service · Kubernetes · edge (Rust/Wasm core) · enterprise (permissioned execution adapter committing through the confidential backend). See [PRD §28](PRD.md#28-deployment-models).

## 8. Implementation status

See [PRD §12.9](PRD.md#129-current-implementation-status). Today: core, crypto, graph, policy, backend-local, sdk, cli exist (TypeScript). The Aztec backend (`@sigil/backend-aztec`, `noir`), ZK proofs, and execution adapters are planned; the Midnight backend (`@sigil/backend-midnight`, `compact`) is on hold.
