# Sigil — Plugin System

Sigil is modular: every capability is a plugin behind a TypeScript interface defined in `@sigil/core`. See also [PRD §17](PRD.md#17-plugin-architecture).

## Eight plugin categories

| Category | Interface(s) | Purpose | Shipping example |
|---|---|---|---|
| **Storage** | `GraphStore` | persist/traverse the provenance graph | `SqliteGraphStore` |
| **Backend** | `Backend` | anchor & verification adapters | `LocalBackend` |
| **Identity** | `CryptoProvider` | DID resolution, key management | `Ed25519Provider` |
| **Policy** | `PolicyEngine` | disclosure rule evaluation | `DefaultPolicyEngine` |
| **Proof** | (proof/commitment) | ZK proofs, signatures, commitments | Ed25519 (ZK planned) |
| **Evidence** | (evidence store) | content-addressable evidence | SHA-256 / IPFS (planned) |
| **Visualization** | (renderer) | graph & timeline rendering | DOT, JSON-LD exporters |
| **Query** | (query engine) | structured & traversal queries | asset-centric traversal |

## Core interfaces

```ts
interface GraphStore {
  putAsset(a: Asset): Promise<void>; getAsset(id: AssetId): Promise<Asset | null>;
  putEvent(e: Event): Promise<void>; getEvents(assetId: AssetId): Promise<Event[]>;
  traverse(assetId: AssetId): Promise<ProvenanceChain>;
  putClaim(c: Claim): Promise<void>; getClaims(subject: string): Promise<Claim[]>;
  putAttestation(t: Attestation): Promise<void>;
  getAttestationsForClaim(claimId: ClaimId): Promise<Attestation[]>;
  /* … see @sigil/core for the full surface */
}

interface CryptoProvider {
  sign(data: Uint8Array, sk: Uint8Array): Promise<Signature>;
  verify(sig: Signature, data: Uint8Array, pk: Uint8Array): Promise<boolean>;
  hash(data: Uint8Array): Promise<Hash>;
  generateKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }>;
  generateDID(pk: Uint8Array): Promise<DID>;
}

interface PolicyEngine {
  evaluate(asset: Asset, viewer: DID, policy: Policy, roles: VisibilityLevel[]): Promise<DisclosureResult>;
  getVisibleFields(asset: Asset, viewer: DID, roles: VisibilityLevel[]): Promise<string[]>;
}
```

## Writing a plugin

1. Implement the relevant interface from `@sigil/core`.
2. Keep it dependency-light and deterministic where verification depends on it.
3. Provide unit tests (Vitest) mirroring the shipping plugins.
4. Wire it in via `SigilConfig` (`crypto`, `graph`, `policy`) or backend selection.

This design enables independent development and a marketplace of interchangeable components.
