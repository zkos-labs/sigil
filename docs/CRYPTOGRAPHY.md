# Sigil — Cryptographic Model

This document specifies Sigil's cryptographic primitives and proof model, implemented in `@sigil/crypto`. See also [PRD §15](PRD.md#15-cryptographic-model).

## 1. Hashing

**SHA-256** over a deterministic **JSON Canonicalization Scheme (JCS)** serialization, so logically identical objects hash identically. `Sha256Hasher` provides hex and byte outputs.

## 2. Identity — `did:sigil`

A Sigil DID is derived from an Ed25519 public key:

```text
did:sigil:<hex(sha256(pk))>        // 64 lowercase hex characters
```

`DIDGenerator` creates and validates DIDs; `KeyManager` handles keypair generation and hex serialization. The DID resolves to a document with the public key, verification methods, and service endpoints. A full method with rotation/delegation/recovery is planned.

> Note: the reference implementation encodes the SHA-256 digest as hex. The founding paper describes a `base58btc` encoding; hex is the current canonical form in code. This will be reconciled in the `did:sigil` method spec.

## 3. Signatures

**Ed25519** (RFC 8032) via `@noble/ed25519`. Signing pipeline:

```text
1. canonicalize fields (JCS)
2. h = SHA-256(serialize(fields))
3. σ = Ed25519Sign(sk, h)
4. attach σ to the object
```

Verification recomputes `h` and checks `σ` against the signer's public key; any modification invalidates the signature. `secp256k1` is declared in `ProofType` and planned but not yet implemented.

## 4. Merkle trees

`MerkleTree` builds SHA-256 trees (odd leaves duplicated), producing roots and `O(log n)` inclusion proofs (~256 bytes up to ~1M leaves). Two trees per asset are specified: an **event tree** (leaves = events by timestamp) and a **claim tree** (leaves = claims). Verification reconstructs the root from a leaf + sibling hashes.

> Status: the Merkle tree is implemented and unit-tested but not yet wired into receipts/anchoring — that integration is planned (see [PRD §12.9](PRD.md#129-current-implementation-status)).

## 5. Commitments

Policy `commit` actions produce **Pedersen commitments**, letting a value be committed publicly and selectively opened later via proof without revealing it at disclosure time.

## 6. Zero-knowledge integration (Midnight)

At the Midnight trust anchor, a selective-disclosure proof `Π_ZK` attests that:

1. the claim is valid (signature verified in-circuit),
2. the claim is included in the asset's claim Merkle tree (Merkle proof in-circuit),
3. the disclosed fields satisfy the policy (policy circuit),
4. undisclosed fields remain private witnesses.

The verifier receives `Π_ZK`, the disclosed values, and the Merkle root — confirming authenticity while learning nothing about hidden fields. *(Planned — the Midnight backend and Compact circuits are not yet implemented; see [RFC 0003](RFC/0003-midnight-adapter.md) and [RFC 0004](RFC/0004-selective-disclosure.md).)*

## 7. Content addressing

Evidence artifacts are content-addressed by SHA-256; the hash is both retrieval key (e.g. IPFS CID) and integrity fingerprint. Modifying evidence changes its hash and invalidates any referencing claim.

## 8. Verification is trustless

All verification — hash recomputation, signature checks, Merkle inclusion, ZK proof — is deterministic and independently runnable. No step requires trusting Sigil's storage or infrastructure.
