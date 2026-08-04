# Sigil — Roadmap

Milestones are directional. v0.1 core primitives exist today; everything from the confidential backend onward is planned. See [PRD §12.9](PRD.md#129-current-implementation-status) for current status and [PRD §29](PRD.md#29-roadmap).

## v0.1 — Core provenance engine *(in progress)*

- ✅ `@sigil/core` type/interface contracts
- ✅ `@sigil/crypto` — Ed25519, SHA-256, `did:sigil`, Merkle
- ✅ `@sigil/graph` — SQLite store, DOT/JSON-LD export
- ✅ `@sigil/policy` — 5-tier disclosure, default-deny
- ✅ `@sigil/backend-local`, `@sigil/sdk`, `@sigil/cli`
- ✅ Wire policy engine into the SDK (policy-gated disclosure); race-safe identity init; `ulid` runtime dependency
- ✅ Real `LocalBackend.verify` (receipt-vs-committed-state); CLI integration tests; repo-wide lint/typecheck/coverage green
- 🔲 Harden SDK further: durable (non–in-memory) store; CLI cross-invocation persistence

## v0.2 — Graph engine

- Generalized node/edge graph store
- Full temporal/filtered queries (honor `QueryFilter`)
- Merkle-into-receipt integration
- Richer traversal & analytics

## v0.3 — Aztec integration *(Confidential Backend)*

- `@sigil/backend-aztec` adapter (`aztec.js`)
- `noir` — Aztec.nr / Noir circuits
- Commitment anchoring, client-side ZK proof gen/verify (PXE)
- Policy → circuit compilation
- Ethereum settlement path

## v0.4 — Selective disclosure

- Wire policy engine into the SDK end-to-end
- Cryptographically enforced disclosure with ZK receipts
- Full reveal / redact / hash / commit actions

## v0.5 — Multi-backend support

- Execution adapters: Ethereum, Solana, Cardano, Avalanche, Hyperledger
- Cross-chain anchoring through the confidential backend
- Runtime backend selection

## v0.6 — Second confidential backend *(on hold)*

- `@sigil/backend-midnight` adapter + `compact` circuits — **on hold** pending Midnight ecosystem maturity
- Portable disclosure receipts across confidential backends
- Proves the confidential layer is pluggable in fact, not just in claim

## v1.0 — Production release

- Hardened crypto, stable REST/GraphQL/gRPC APIs
- Full docs, reference applications, external security review
- Deployment tooling

## v2.0 — Distributed provenance network

- Byzantine-fault-tolerant provenance network (same client API)
- Rust core with Wasm bindings
- Formal verification of the policy engine
