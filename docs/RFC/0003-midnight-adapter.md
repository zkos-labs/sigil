# RFC 0003 — Midnight Adapter (Trust Anchor)

- **Status:** Draft
- **Authors:** ZKOS Labs
- **Related:** [BACKENDS.md](../BACKENDS.md), [CRYPTOGRAPHY.md](../CRYPTOGRAPHY.md), [PRD §18](../PRD.md#18-trust-anchor--execution-layers)

## Summary

Specify `@sigil/backend-midnight` and the `compact` circuit package that make Midnight Sigil's confidential **trust anchor**: commitment anchoring, ZK proof generation/verification, and policy-to-circuit compilation.

## Motivation

Midnight is the root of trust for the whole architecture — the confidential anchor into which applications on any chain anchor via Sigil. Both `@sigil/backend-midnight` and `compact` are currently empty scaffolding. This RFC defines their contract so the "generate locally → anchor to Midnight → return commitment" pattern becomes real.

## Design sketch

- Implement the `Backend` interface against the Midnight.js SDK using `MidnightConfig { network, walletPath?, indexerUrl?, proofServerUrl? }`.
- `commit`: anchor Merkle roots / Pedersen commitments to Midnight.
- `disclose`: generate `Π_ZK` (Kachina/Compact) attesting claim validity, Merkle inclusion, policy satisfaction, and privacy of undisclosed fields.
- `verify`: verify anchored commitments and ZK proofs.
- `compact`: Compact contracts compiling disclosure policies into circuit constraints (`reveal`/`hash`/`redact` → constraints).

## Alternatives considered

- Treating Midnight as one backend among equals (rejected — it is the trust anchor, per [PRD §6](../PRD.md#6-product-positioning)).
- Self-hosted prover only (deferred to multi-prover future work).

## Open questions

- Proving latency vs. the < 1s [target](../PRD.md#performance-targets) for realistic claim sets.
- Testnet vs. mainnet flows and key/wallet management.
- Multi-prover / self-hosted proving to reduce single-anchor dependence.
