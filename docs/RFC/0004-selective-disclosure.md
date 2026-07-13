# RFC 0004 — Selective Disclosure

- **Status:** Draft
- **Authors:** ZKOS Labs
- **Related:** [POLICY.md](../POLICY.md), [RFC 0003](0003-midnight-adapter.md), [PRD §16](../PRD.md#16-policy--selective-disclosure)

## Summary

Define the end-to-end selective-disclosure flow: policy language, the four disclosure actions, SDK integration, and cryptographic enforcement via the Midnight anchor.

## Motivation

The policy engine (`@sigil/policy`) implements a 5-tier, default-deny visibility ladder and is well-tested. It is now **wired into the SDK** — `Sigil.disclose` routes through `DefaultPolicyEngine`, so disclosure is policy-gated. The remaining gap is that disclosure results carry `ProofType.None` — enforcement is logical, not yet cryptographic. This RFC covers closing that gap at the Midnight anchor.

## Design sketch

- **SDK integration:** ✅ done — the `Sigil` constructor instantiates `DefaultPolicyEngine` (overridable via `SigilConfig.policy`) and passes it to the backend so `disclose` honors policy field-by-field.
- **Actions:** realize all four — `reveal` (plaintext), `redact` (`null`), `hash` (SHA-256), `commit` (Pedersen) — end to end.
- **Enforcement:** on the Midnight anchor, compile policy to Compact circuits and emit a single `Π_ZK` attesting exact rule application; return a proof-bearing `DisclosureReceipt`.
- **Non-interference:** a lower-level viewer must learn nothing about higher-level fields — a target for formal verification.

## Alternatives considered

- Keep disclosure logical-only (rejected — defeats the confidential-provenance thesis).
- Per-field separate proofs (deferred — one aggregate proof is cheaper to verify).

## Open questions

- Attribute/condition language beyond the level ladder (roles, orgs, VC presentations).
- Receipt format and revocation of previously issued disclosures.
- Mechanical proof of non-interference for the policy engine.
