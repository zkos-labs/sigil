# RFC 0005 — Aztec Adapter (Primary Confidential Backend)

- **Status:** Draft
- **Authors:** ZKOS Labs
- **Related:** [BACKENDS.md](../BACKENDS.md), [CRYPTOGRAPHY.md](../CRYPTOGRAPHY.md), [RFC 0003](0003-midnight-adapter.md), [PRD §18](../PRD.md#18-confidential-execution--interoperability-layers)

## Summary

Specify `@sigil/backend-aztec` and the `noir` circuit package as Sigil's **primary confidential backend**: commitment anchoring, zero-knowledge proof generation and verification, and policy-to-circuit compilation on [Aztec](https://aztec.network).

## Motivation

Sigil's selective disclosure is currently logical, not cryptographic — `disclose` returns `ProofType.None`. Closing that gap needs a confidential execution environment, and Sigil's confidential-execution layer is deliberately pluggable (see [RFC 0003](0003-midnight-adapter.md) for the deferred alternate).

Aztec is the backend Sigil implements first:

- Purpose-built for confidential smart contracts, with private and public state in the same contract.
- Contracts are written in Aztec.nr on top of **Noir**, a mature ZK DSL.
- Private functions execute **client-side** in the PXE (Private Execution Environment), so private provenance data never leaves the holder's machine to reach a third-party prover.
- Settles to **Ethereum L1**, giving Sigil access to the identity, attestation, and wallet standards already established there.

## Design sketch

- Implement the `Backend` interface against `aztec.js` using `AztecConfig { network: "sandbox"|"testnet"|"mainnet"; pxeUrl?; l1RpcUrl?; accountAddress? }` (`@sigil/core`).
- `commit`: anchor Merkle roots / Pedersen commitments into an Aztec.nr contract — private notes for confidential provenance, public state for anchors that must be independently observable.
- `disclose`: generate `Π_ZK` in the PXE attesting claim validity, Merkle inclusion, policy satisfaction, and privacy of undisclosed fields; return a proof-bearing `DisclosureReceipt` with `ProofType.AztecZk`.
- `verify`: verify anchored commitments and proofs; L1 settlement gives an Ethereum-verifiable fallback path.
- `noir`: Aztec.nr contracts compiling disclosure policies into circuit constraints — `reveal` → value-matches-commitment, `hash` → correct-hash, `redact` → no constraint. One proof attests all rules were applied exactly.

Neither `@sigil/backend-aztec` nor `packages/noir` exists yet; both are planned for v0.3.

## Alternatives considered

- **Midnight first** (deferred, not rejected — see [RFC 0003](0003-midnight-adapter.md)). Midnight's Compact/Kachina model fits Sigil well, but its developer ecosystem, wallets, and identity/attestation integrations are less mature than Ethereum's today.
- **A single hard-wired anchor.** Rejected: it makes Sigil's viability dependent on one ecosystem's success. Sigil owns the provenance model, trust graph, attestation schema, and disclosure logic; confidential networks are interchangeable backends beneath the same five-method interface.
- **TEE-based confidential backend.** Lower latency, but adds hardware trust assumptions. The `Backend` interface admits one later without redesign.

## Open questions

- Client-side proving latency vs. the < 1s [target](../PRD.md#performance-targets) for realistic claim sets, and whether proving should be delegated for thin clients.
- Note discovery: provenance queries traverse graphs, and private notes are not globally scannable. How much of the graph stays in the local store vs. on-chain?
- Sandbox / testnet / mainnet account and key management.
- Which commitments belong in private notes vs. public contract state, given that some auditors need to observe that an anchor exists without seeing its contents.
