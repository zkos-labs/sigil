# RFC 0003 — Midnight Adapter (Deferred Alternate Backend)

- **Status:** Deferred (network maturity; revisit v0.6+)
- **Authors:** ZKOS Labs
- **Related:** [RFC 0005](0005-aztec-adapter.md) *(primary confidential backend)*, [BACKENDS.md](../BACKENDS.md), [CRYPTOGRAPHY.md](../CRYPTOGRAPHY.md), [PRD §18](../PRD.md#18-confidential-execution--interoperability-layers)

> **On hold.** Aztec is Sigil's first confidential backend — see [RFC 0005](0005-aztec-adapter.md). Midnight remains a designed-for second backend, not a discarded one: this RFC stays as the specification to pick up when the network's tooling, wallets, and integrations mature.

## Summary

Specify `@sigil/backend-midnight` and the `compact` circuit package as a confidential backend for Sigil: commitment anchoring, ZK proof generation/verification, and policy-to-circuit compilation.

## Motivation

Midnight's data-protection-first design maps cleanly onto Sigil's needs — public/private state separation, native selective disclosure, and automatic Kachina-based proof generation. Implementing it as a second backend also proves out the claim that Sigil's confidential-execution layer is genuinely pluggable rather than one anchor with an abstraction bolted on.

It is deferred because its developer ecosystem is still small relative to Ethereum's, and the identity, attestation, wallet, and interoperability standards Sigil depends on are more established around Ethereum today. Both `@sigil/backend-midnight` and `compact` remain unimplemented.

## Design sketch

- Implement the `Backend` interface against the Midnight.js SDK using `MidnightConfig { network, walletPath?, indexerUrl?, proofServerUrl? }`.
- `commit`: anchor Merkle roots / Pedersen commitments to Midnight.
- `disclose`: generate `Π_ZK` (Kachina/Compact) attesting claim validity, Merkle inclusion, policy satisfaction, and privacy of undisclosed fields; return a receipt with `ProofType.MidnightZk`.
- `verify`: verify anchored commitments and ZK proofs.
- `compact`: Compact contracts compiling disclosure policies into circuit constraints (`reveal`/`hash`/`redact` → constraints) — the Midnight equivalent of the Noir circuits in RFC 0005.

## Alternatives considered

- Treating Midnight as *the* trust anchor, with every other chain anchoring into it (rejected — it makes Sigil dependent on a single ecosystem's success; the confidential layer is pluggable instead).
- Self-hosted prover only (deferred to future work; note that Aztec's client-side PXE proving already avoids the third-party prover question).

## Open questions

- Proving latency vs. the < 1s [target](../PRD.md#performance-targets) for realistic claim sets.
- Testnet vs. mainnet flows and key/wallet management.
- Whether `Π_ZK` produced by Compact and by Noir can share a receipt format, so disclosures remain portable across backends.
- What maturity signals should trigger picking this RFC back up.
