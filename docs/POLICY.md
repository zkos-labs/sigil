# Sigil — Policy & Selective Disclosure

This document specifies the policy engine (`@sigil/policy`) and selective disclosure. See also [PRD §16](PRD.md#16-policy--selective-disclosure).

## 1. Visibility ladder

Five inclusive levels (`VisibilityLevel`), each inheriting those below:

| Level | Value | Typical disclosure |
|---|---|---|
| Private | 0 | none (existence may be committed) |
| Partner | 1 | identifiers/timestamps for integration |
| Auditor | 2 | audit fields (quantities, certifications, trails) |
| Regulator | 3 | regulatory fields (auditor superset + compliance metadata) |
| Public | 4 | all non-sensitive fields |

## 2. Policy schema

```ts
interface Policy {
  id: PolicyId;
  assetType?: string;
  rules: PolicyRule[];               // { field: string; visibleAt: VisibilityLevel }
}
```

A rule makes `field` visible at `visibleAt` and above. `id` and `type` are always visible; unmatched fields are **default-deny** (`redact`).

## 3. Disclosure actions

The richer disclosure model supports four per-field actions that map to cryptographic operations:

| Action | Result |
|---|---|
| `reveal` | plaintext value |
| `redact` | `null` |
| `hash` | `SHA-256(value)` — integrity without disclosure |
| `commit` | Pedersen commitment — openable later via proof |

## 4. Evaluation

```text
Disclose(Asset, Viewer, Policy) → { field: value | null }
```

`DefaultPolicyEngine.evaluate` returns each field's value if the viewer's highest role ≥ the rule's `visibleAt` (and any condition holds), else `null`. `getVisibleFields` returns the permitted field set. Conditions may evaluate viewer attributes: role, organization, DID, presented Verifiable Credentials (attribute-based disclosure).

## 5. Outputs

- `DisclosureResult { assetId, fields: Record<string, value|null>, proof }`
- `DisclosureReceipt { id, assetId, recipient, level, disclosedFields, proof, issuedAt }`

The receipt records who received which fields when, forming part of the audit trail.

## 6. Cryptographic enforcement (confidential backend)

Policies compile to circuit constraints: `reveal` constrains the revealed value to match the committed value at a position; `hash` constrains correct hashing; `redact` contributes no constraint. The backend emits one ZK proof that all rules were applied exactly — no more, no less. This upgrades disclosure from *promised* (default-deny logic) to *cryptographically enforced*.

On **Aztec** (active) the constraints are Noir circuits proved client-side in the PXE; on **Midnight** (on hold) they are Compact circuits. The mapping is the same either way — that equivalence is what keeps the backend swappable.

## 7. Status & non-interference

Today the policy engine is implemented, unit-tested with default-deny semantics, and **wired into the SDK** — `Sigil.disclose` routes through `DefaultPolicyEngine`, so a viewer below an asset's required level receives no fields. Disclosure proofs are still `ProofType.None` (not yet cryptographically enforced) pending the confidential backend (see [PRD §12.9](PRD.md#129-current-implementation-status)). Non-interference (a lower-level viewer learns nothing about higher-level fields) is a target for formal verification.
