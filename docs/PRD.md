# Sigil — Product Requirements Document

**Confidential Provenance Engine for Programmable Trust**

**Version:** 0.1 (Draft)
**Organization:** ZKOS Labs
**Status:** Living document — tracks vision and requirements; see [§12.9 Current Implementation Status](#129-current-implementation-status) for what is built today.
**License:** Apache 2.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision](#2-vision)
3. [Mission](#3-mission)
4. [Problem Statement](#4-problem-statement)
5. [Opportunity](#5-opportunity)
6. [Product Positioning](#6-product-positioning)
7. [Design Principles](#7-design-principles)
8. [Goals](#8-goals)
9. [Non-Goals](#9-non-goals)
10. [Personas](#10-personas)
11. [Core Concepts](#11-core-concepts)
12. [System Architecture](#12-system-architecture)
13. [Provenance Graph Model](#13-provenance-graph-model)
14. [Data Model](#14-data-model)
15. [Cryptographic Model](#15-cryptographic-model)
16. [Policy & Selective Disclosure](#16-policy--selective-disclosure)
17. [Plugin Architecture](#17-plugin-architecture)
18. [Confidential Execution & Interoperability Layers](#18-confidential-execution--interoperability-layers)
19. [Identity & Credentials](#19-identity--credentials)
20. [Evidence Framework](#20-evidence-framework)
21. [Query Engine](#21-query-engine)
22. [SDK & Developer Experience](#22-sdk--developer-experience)
23. [APIs](#23-apis)
24. [Storage Layer](#24-storage-layer)
25. [Security Model](#25-security-model)
26. [Standards & Interoperability](#26-standards--interoperability)
27. [Reference Applications](#27-reference-applications)
28. [Deployment Models](#28-deployment-models)
29. [Roadmap](#29-roadmap)
30. [Success Metrics](#30-success-metrics)
31. [Risks](#31-risks)
32. [Open Questions](#32-open-questions)
33. [Future Research](#33-future-research)
34. [Appendix](#34-appendix)
- [Appendix A — Ecosystem Architecture](#appendix-a--ecosystem-architecture)
- [Companion Documents](#companion-documents)

---

# 1. Executive Summary

**Sigil is a multichain zero-knowledge provenance layer with a pluggable confidential execution layer. Applications running on Ethereum, Solana, Cardano, or other ecosystems can generate verifiable provenance through Sigil, while a confidential backend — [Aztec](https://aztec.network) today, Midnight on hold — handles commitments, selective disclosure, and zero-knowledge verification.**

**Elevator pitch.** Every regulated industry now faces the same contradiction: regulators, auditors, and customers demand cryptographically verifiable histories of digital and physical objects, yet the parties who hold that history cannot expose it wholesale without leaking competitively sensitive data. Sigil resolves this contradiction. It lets developers record the full provenance of any asset — its origin, custody, transformations, and attestations — and then disclose *exactly* the fields a given viewer is entitled to, backed by a zero-knowledge proof that the disclosure is faithful to the underlying record.

**What Sigil is.** Sigil is an open-source provenance engine: a graph-native, event-sourced data model for provenance; an Ed25519-based decentralized identity layer; Merkle-anchored integrity proofs; a programmable policy language for field-level selective disclosure; and a pluggable backend interface. It is delivered as a TypeScript monorepo (`@sigil/core`, `@sigil/crypto`, `@sigil/graph`, `@sigil/policy`, `@sigil/backend-local`, `@sigil/backend-aztec`, `@sigil/sdk`, `@sigil/cli`) with a design deliberately structured so a performance-critical Rust core can replace the reference implementation without changing the developer-facing contracts.

**Why it exists.** Existing provenance systems force a false binary. Public blockchains make everything verifiable *and* everything visible. Centralized databases keep data private but require every verifier to trust the operator. Domain platforms (food, pharma, ESG) work in silos with non-programmable disclosure. None of them delivers verifiable-*and*-confidential provenance that is portable across backends. Sigil is built to be exactly that missing infrastructure layer.

**Relationship to confidential networks.** Sigil does not compete with confidential blockchains and is not merely "built for" one. It defines its own provenance model, trust graph, attestation schema, and selective-disclosure logic, and treats confidential networks as **interchangeable backends** beneath a single interface. Applications may *live* on Ethereum, Solana, Cardano, Avalanche, Hyperledger, or entirely off-chain; through Sigil they generate provenance locally, commit its cryptographic commitment through the active confidential backend, and receive back a portable proof. The analogy is EigenLayer to Ethereum: EigenLayer is not Ethereum, but Ethereum is where its security is rooted. Likewise Sigil is not Aztec, but Aztec — settling to Ethereum — is where its confidentiality and provenance integrity are currently rooted. Deliberately, Sigil is *not* "the provenance layer for Aztec": binding the product to one ecosystem's success is the failure mode this architecture avoids. See §6 and §18.

**Relationship to other ZKOS projects.** Sigil is one member of the ZKOS Labs stack. It consumes cryptographic and execution infrastructure (Daemon, confidential backends, IPFS, identity providers) and exposes provenance as a reusable primitive that sibling projects (referenced in this document as Daemon, Tirenor, and Olwen) can build upon rather than reimplement.

**Vision statement.** *A universal, confidential provenance layer for the verifiable digital economy — where any claim about any asset can be independently verified without exposing what must remain private.*

**Example use cases.** An EU Digital Product Passport that proves a battery's recycled-content ratio to a regulator while hiding supplier pricing from competitors; an AI model registry that proves a model was trained only on licensed data without publishing the training set; a coffee cooperative that proves fair-trade certification end-to-end while keeping farm-gate prices confidential; a carbon-credit registry that proves an offset has not been double-counted without revealing the project's commercial terms.

---

# 2. Vision

## Long-term vision

Provenance should be a shared public utility, not a feature re-built inside every application. Sigil's long-term vision is to become the default layer that developers reach for whenever they need to answer "what happened to this object, who vouches for it, and how can that be proven?" — with confidentiality treated as a first-class property rather than an afterthought. In the target end-state, provenance is portable across ecosystems, verifiable by anyone, and disclosed only to the degree each viewer is entitled to.

## Why provenance matters

Provenance is the connective tissue of trust in a digital economy. As objects — datasets, models, physical goods, credentials, financial instruments — move through complex multi-party pipelines, the ability to trace their origin, custody, and transformation determines whether claims about them can be believed. Without verifiable provenance, every downstream party must either trust the upstream party's word or re-verify everything themselves. Both are expensive; both fail at scale.

## Confidential provenance

The novel contribution Sigil pursues is *confidential* provenance: the ability to prove specific facts about an object's history without revealing the whole history. A supplier can prove a component passed inspection without exposing the inspection report; an auditor can confirm emissions figures without seeing pricing; a model owner can prove data lineage without publishing the data. Confidentiality is what makes verifiable provenance commercially adoptable in competitive markets.

## Programmable trust

Trust in Sigil is programmable. Disclosure is governed by policies — machine-readable rules that define which fields are visible to which viewers under which conditions. Because policies are data, they can be versioned, audited, composed, and (in the confidential backend) compiled into zero-knowledge circuits that make disclosure cryptographically enforced rather than merely promised.

## Universal provenance layer

Sigil aims to be universal along three axes: **domain-universal** (one engine serves supply chains, AI, ESG, science, identity); **backend-universal** (the same provenance record can be committed through a confidential backend, mirrored to Ethereum or Cardano, or kept local); and **standard-universal** (interoperable with W3C PROV, DID Core, Verifiable Credentials, SLSA, SPDX, and CycloneDX rather than inventing a closed format).

---

# 3. Mission

- **Build reusable provenance infrastructure.** Provide a batteries-included engine so teams stop rebuilding provenance from scratch and instead compose it from a stable set of primitives.
- **Enable selective disclosure.** Make field-level, policy-driven, zero-knowledge disclosure the default way provenance is shared — verifiable without over-sharing.
- **Become backend agnostic.** Abstract the anchor and execution substrate behind a five-method interface so applications are never coupled to one chain or database.
- **Standardize provenance APIs.** Converge on open, well-documented APIs and data models so provenance produced by one tool can be consumed by another.

---

# 4. Problem Statement

## Existing solutions

### Public blockchains

Public chains deliver append-only immutability and global verifiability, but the same transparency that enables verification exposes every attribute and relationship to every participant. For supply-chain and ESG data, this leaks supplier relationships, pricing, and production volumes to competitors. Layer-two and sidechain scaling do not address confidentiality.

### Centralized databases

Centralized systems offer performance and access control but provide no mechanism for an independent party to verify a claim without trusting the operator. Integrity depends entirely on the database owner's honesty and operational security.

### Enterprise provenance systems

Permissioned ledgers such as Hyperledger Fabric add channel-based confidentiality but introduce a consortium trust model: the ordering service and endorsing peers must be collectively trusted, which is weaker than cryptographic zero-knowledge guarantees and not portably verifiable outside the consortium.

### AI provenance

AI systems are increasingly opaque about training-data origin, licensing, and evaluation. Existing model cards and registries are self-reported and unverifiable, and emerging regulation (EU AI Act, NIST AI RMF) is pushing toward traceability requirements that current tooling cannot cryptographically satisfy.

### Scientific provenance

Research-integrity and reproducibility workflows need to link datasets, methods, instruments, and results, but current provenance capture is ad hoc, rarely signed, and almost never supports selective disclosure of embargoed or sensitive data.

### ESG systems

ESG reporting platforms rely on self-reported data uploaded to centralized portals, with audit trails held by the platform operator. There is no cryptographic mechanism for an independent party to verify that a carbon-offset or emissions claim has not been altered since issuance.

## Current limitations

Across these categories, four properties are never satisfied simultaneously: verifiability, confidentiality, backend-independence, and domain-generality. Systems are either transparent or opaque, blockchain-specific or database-specific, domain-tied or general-purpose — but never all four at once.

## Why existing systems fail

They fail because they treat confidentiality and verifiability as opposites. The moment a system makes data verifiable by publishing it, it sacrifices confidentiality; the moment it protects data by siloing it, it sacrifices independent verifiability. Sigil exists to dissolve this trade-off using zero-knowledge selective disclosure anchored in a confidentiality-first substrate.

---

# 5. Opportunity

## Confidential computing

Confidential computing — whether via zero-knowledge proofs or trusted execution environments — has matured to the point where privacy-preserving verification is practical. Sigil's pluggable backend can accommodate both, with ZK as the primary path.

## Zero-knowledge

zk-SNARKs offer constant-size proofs and fast verification; zk-STARKs add post-quantum security. These primitives now make it feasible to prove statements about provenance data without revealing it, which is the technical unlock behind Sigil's entire thesis.

## Aztec Network

Aztec is a privacy-first Ethereum L2 built for confidential smart contracts: private and public state live in the same contract, contracts are written in Aztec.nr on top of the **Noir** ZK language, and private functions execute **client-side** in the PXE (Private Execution Environment) so private inputs never leave the holder's machine. It settles to Ethereum, which brings the identity, attestation, and wallet standards Sigil depends on. This makes it Sigil's first confidential backend.

## Midnight Network *(on hold)*

Midnight's data-protection-first architecture, built on the Kachina protocol and the Compact contract language, provides native support for public/private state separation and selective disclosure — a close fit for Sigil's needs and the reason it remains a specified second backend. It is **on hold**: its developer ecosystem, wallets, and identity/attestation integrations are less mature than Ethereum's today. See [RFC 0003](RFC/0003-midnight-adapter.md).

## AI governance

The EU AI Act's traceability obligations for high-risk systems create demand for verifiable, privacy-preserving AI model and dataset lineage — a natural first-class Sigil application.

## Digital identity

Decentralized identity (DIDs, Verifiable Credentials) provides the identity substrate provenance needs: claims and attestations must be bound to identifiable, verifiable issuers. Sigil consumes and extends this ecosystem.

## Environmental compliance

The EU Digital Product Passport (under ESPR, phasing in from 2026), SEC climate disclosure rules, and CSRD create a large, mandatory market for verifiable environmental provenance with confidentiality guarantees.

## Manufacturing

Digital thread and digital twin initiatives need tamper-evident records of materials, processes, and inspections across multi-tier supplier networks — with strict confidentiality between competing suppliers.

## Supply chains

Global supply chains lose trillions to disruption and fraud, and ethical-sourcing and carbon claims rely on self-reported data. Verifiable, confidential provenance is directly monetizable here.

---

# 6. Product Positioning

## What Sigil is

Sigil is a confidential provenance *engine and middleware layer*. It is the reusable component that sits between applications and the cryptographic/execution substrate, turning raw events into verifiable, selectively disclosable provenance graphs.

## What Sigil isn't

Sigil is not a blockchain, not a token, not a vertically integrated supply-chain or ESG SaaS product, not an identity provider, and not a wallet. It does not attempt to own the application; it makes applications verifiable.

## Relationship with confidential backends

Sigil's **Confidential Execution Layer** is pluggable. Sigil itself owns the provenance model, the trust graph, the attestation schema, and the selective-disclosure logic; the confidential network beneath the backend interface supplies commitment anchoring, zero-knowledge proof generation and verification, and policy-compiled disclosure circuits. Two backends are specified:

- **Aztec — active.** Noir/Aztec.nr circuits, client-side proving in the PXE, Ethereum settlement. First implementation target (v0.3).
- **Midnight — on hold.** Compact/Kachina circuits. Kept as a specified second backend; deferred pending ecosystem maturity (v0.6+).

Distinguish three roles that are often conflated:

- The **confidential backend** is *where private state is computed and proofs are generated*. That is Aztec today.
- **Settlement** is *where the confidential backend's state and proofs land*. That is Ethereum.
- The **adapters** are *where applications connect*. Those are Ethereum, Solana, Cardano, Avalanche, Hyperledger, and local storage.

Ethereum occupies two of these roles at once — settlement beneath Aztec, and one execution adapter among several. They are different responsibilities and should not be read as the same box.

An application on Solana does not "store provenance on Solana." It generates provenance locally through Sigil, commits the proof through the confidential backend, and receives a commitment back — so a Solana-native application gains confidential provenance without Solana needing confidential smart contracts.

The analogy: **the confidential backend is to Sigil what Ethereum is to EigenLayer.** EigenLayer is not Ethereum, but Ethereum is where its security is anchored. Sigil is not Aztec, but Aztec is where its confidentiality and provenance integrity are currently rooted.

The analogy has a deliberate limit. Sigil is **not** "the provenance layer for Aztec," and was not "the provenance layer for Midnight" before it. Binding the product's viability to a single ecosystem is the failure mode this architecture exists to avoid; that is why a second backend stays specified rather than deleted, and why swapping one changes the adapter, not the model.

## Relationship with Daemon

Daemon is treated as part of the cryptographic/execution infrastructure Sigil consumes. Sigil delegates lower-level execution and cryptographic services to Daemon where available rather than reimplementing them.

## Relationship with Tirenor

Tirenor is a sibling ZKOS project that can consume Sigil's provenance primitives. Sigil exposes provenance as a service so Tirenor need not build its own provenance model.

## Relationship with Olwen

Olwen is likewise a sibling ZKOS project positioned as a Sigil consumer. The relationship is compositional: Sigil provides verifiable, confidential provenance; Olwen builds domain functionality atop it.

## Ecosystem positioning

Within the ZKOS stack, Sigil is the provenance and programmable-trust layer. Applications integrate the Sigil SDK; the SDK talks to the Sigil core engine; the engine roots trust in the confidential backend and, when needed, mirrors or references other execution chains through adapters. See [Appendix A](#appendix-a--ecosystem-architecture).

---

# 7. Design Principles

## Backend agnostic

Provenance logic must never be coupled to a specific chain or database. Every backend implements one uniform interface (`commit`, `query`, `verify`, `disclose`, `revoke`), so new anchors and execution targets are added without touching provenance or policy code.

## Privacy first

All data is confidential by default. Disclosure happens only through explicit policy. The system is designed so that the *absence* of a disclosure rule denies access (default-deny), never grants it.

## Event sourced

State is derived from an append-only, immutable log of events. Nothing is mutated in place; corrections are new events that reference their predecessors. This yields tamper-evidence, complete replay, and full auditability.

## Graph native

Provenance is a directed graph of assets, events, claims, attestations, and evidence. Storage and query are designed for traversal, not relational joins, enabling lineage and impact queries that are awkward or impossible over flat ledgers.

## Cryptographically verifiable

Every claim, attestation, and evidence object is hashed and signed; Merkle roots anchor inclusion; and the confidential backend adds zero-knowledge proofs. Verification never requires trusting the storage operator.

## Developer first

The primary user is a developer. The SDK, CLI, and APIs are designed for a short path from install to a working, verifiable provenance graph, with sensible defaults and explicit escape hatches.

## Open standards

Sigil maps onto W3C PROV, DID Core, Verifiable Credentials, JSON-LD, SPDX, CycloneDX, SLSA, and OpenTelemetry rather than inventing closed formats, so provenance is portable and interoperable.

## Modular

Every capability — storage, backend, identity, policy, proof, evidence, visualization, query — is a plugin behind a TypeScript interface, enabling independent development and a marketplace of interchangeable components.

---

# 8. Goals

## Functional goals

- Record assets, events, claims, attestations, and evidence as a signed, event-sourced provenance graph.
- Generate and verify Ed25519 signatures and `did:sigil` identities.
- Produce and verify Merkle inclusion proofs for events and claims.
- Evaluate JSON-defined selective-disclosure policies across a five-tier visibility ladder.
- Anchor commitments and generate zero-knowledge selective-disclosure proofs via the confidential backend.
- Provide a uniform backend interface with local, Aztec, Midnight, and mock implementations, and adapters for additional execution chains.
- Ship a TypeScript SDK and CLI, with Rust/Python/Go bindings planned.

## Non-functional goals

- **Portability:** identical provenance semantics across every backend.
- **Auditability:** deterministic, independently auditable verification and policy logic.
- **Stability:** a versioned public interface (`@sigil/core`) that downstream code and a future Rust core both honor.
- **Confidentiality:** no field is disclosed absent an explicit policy grant.

## Performance targets

These targets are drawn from the founding paper's benchmarks on a single developer workstation using the local SQLite backend; they are engineering targets for the reference implementation, not production SLAs.

| Operation | Target |
|---|---|
| Asset creation throughput | ~500 assets/s |
| Graph traversal (depth 100) | < 50 ms |
| Claim verification | < 2 ms |
| Merkle proof size | ~256 bytes |
| Policy evaluation (10 rules) | < 1 ms |
| Full ZK disclosure (confidential backend) | < 1 s |

## Scalability targets

- Support ~100K assets with full provenance chains (~50 events/asset) in a single-node deployment within a few gigabytes of storage.
- Provide a path to horizontal scale via backend sharding and, longer term, a distributed provenance network (v2.0).

---

# 9. Non-Goals

## Not a blockchain

Sigil does not implement consensus, a ledger, or a token. It commits through a confidential backend and references other chains; it does not become one.

## Not a supply chain platform

Sigil is not a turnkey supply-chain product. It is the provenance engine such products would embed.

## Not an ESG platform

Sigil does not provide ESG reporting dashboards or compliance workflows; it provides the verifiable, confidential provenance those platforms need.

## Not an identity provider

Sigil consumes DIDs and Verifiable Credentials; it does not run an identity service or issue credentials on behalf of others.

## Not a wallet

Sigil manages provenance, not user funds or key custody UX. Key management integrates with external providers.

---

# 10. Personas

## SDK developers

Developers embedding provenance into a product. They want a fluent API, good types, and a fast path from `createAsset` to a verifiable graph. Primary interface: `@sigil/sdk`.

## Enterprise developers

Platform teams integrating Sigil into regulated systems. They care about deployment models, backend choice, key management, audit logging, and standards compliance.

## Researchers

Scientists and provenance researchers capturing dataset/method/result lineage, often needing selective disclosure of embargoed data and interoperability with W3C PROV.

## Auditors

Third parties who verify claims. They consume disclosure receipts and proofs at the Auditor visibility level and need deterministic, independently runnable verification.

## Regulators

Authorities entitled to Regulator-level disclosure. They need cryptographic assurance that disclosed fields faithfully reflect the underlying record, without access to unrelated confidential data.

## Organizations

Issuers and owners of assets and claims — companies, cooperatives, labs, agencies — represented by DIDs, issuing signed claims and attestations and defining disclosure policies.

---

# 11. Core Concepts

The vocabulary below is normative and mirrors the types in `@sigil/core`.

## Subject

The entity a claim is about, identified by a string (often an asset id or DID). In the RDF-triple claim model, the subject is the first element of `(subject, predicate, object)`.

## Asset

A digital or physical object whose provenance is tracked: `{ id, type, owner (DID), metadata, visibility, createdAt }`. The `type` classifies the asset (e.g. `ai-model`, `batch-lot`, `carbon-credit`) and governs which claim schemas apply.

## Organization

A class of DID-identified agent that owns assets and issues claims/attestations. Modeled via DIDs rather than a dedicated type.

## Person

An individual agent, also DID-identified. Persons and Organizations are both `Agent`-like roles bound to DIDs.

## Dataset

An asset subtype (`type: dataset`) representing a data collection whose lineage — sources, transformations, licensing — is tracked.

## AI Model

An asset subtype (`type: ai-model`) whose provenance captures training data catalogs, hyperparameters, evaluation results, and model-card attestations.

## Credential

A Verifiable Credential bound to a DID, used to establish issuer/viewer attributes that policies evaluate against.

## Event

A discrete, append-only occurrence in an asset's lifecycle: `{ id, assetId, type, issuer (DID), timestamp, proof, metadata }`. Event types include `created`, `transferred`, `certified`, `inspected`, `revoked`, `updated`, and `custom`.

## Claim

A signed assertion in `(subject, predicate, object)` form: `{ id, subject, predicate, object, issuer, signature, proof, visibility, evidence[] }`.

## Evidence

Supporting data for a claim: `{ type, value, metadata }` where `type` is one of `zk-proof`, `pdf`, `ipfs-cid`, `sensor-data`, `signature`, `external-ref`, `image`.

## Attestation

A third-party counter-signature affirming or disputing a claim: `{ id, claimId, issuer, proof, status, expiresAt }`, where `status` is `active`, `revoked`, or `expired`.

## Policy

A disclosure ruleset: `{ id, assetType?, rules[] }`, where each `PolicyRule` is `{ field, visibleAt }` and `visibleAt` is a `VisibilityLevel`.

## Disclosure

The act of revealing a policy-permitted subset of fields to a recipient, producing a `DisclosureResult` (fields → value|null) and a `DisclosureReceipt` bearing a proof.

## Relationship

A typed edge in the provenance graph — e.g. `derivedFrom`, `composedOf`, `attestedBy`, `references` — connecting nodes into a lineage graph.

## Provenance Graph

The full directed graph for an asset: `{ asset, events[], claims[], attestations[] }` (the `ProvenanceChain`), traversable for lineage, impact, and verification queries.

---

# 12. System Architecture

## 12.1 High-level architecture

Sigil is a layered system. Applications integrate the SDK; the SDK drives the core engine; the core engine roots trust in the active confidential backend and connects to other execution chains through adapters. The defining architectural statement is **not** the name of any one network: Sigil owns the provenance model and treats confidential networks as interchangeable beneath the backend interface, regardless of where the application runs.

```text
               Applications
────────────────────────────────────
 AI · ESG · Supply Chain · Identity · DeSci
────────────────────────────────────
             Sigil SDK
────────────────────────────────────
 Claims · Evidence · Policies · Provenance Graph
────────────────────────────────────
        Sigil Core Engine
────────────────────────────────────
 Graph Engine · Disclosure Engine · Proof Engine
────────────────────────────────────
   Confidential Execution Layer
────────────────────────────────────
 ⭐ Aztec (active) · Midnight (on hold)
────────────────────────────────────
        Settlement Layer
────────────────────────────────────
 Ethereum
────────────────────────────────────
   Execution / Interoperability Layer
────────────────────────────────────
 Ethereum · Solana · Cardano · Avalanche · Hyperledger
────────────────────────────────────
```

Ethereum appears in two roles: as **settlement** beneath the confidential backend, and as one **execution adapter** among several. They are separate responsibilities.

## 12.2 Internal architecture

The core engine comprises three cooperating subsystems:

- **Graph Engine** — the event-sourced, graph-native store and traversal logic (`@sigil/graph`). Owns assets, events, claims, attestations, and their relationships.
- **Disclosure Engine** — the policy parser, evaluator, and disclosure logic (`@sigil/policy`). Decides which fields a viewer may see and drives the proof-carrying disclosure flow.
- **Proof Engine** — the cryptographic subsystem (`@sigil/crypto`) plus the backend integration: hashing, Ed25519 signing, `did:sigil`, Merkle trees, and — in the confidential backend — zero-knowledge proof generation and verification.

## 12.3 Layered architecture

From top to bottom: **Application Layer** (domain consumers) → **SDK Layer** (`@sigil/sdk`, `@sigil/cli`, future bindings) → **Core Engine Layer** (Graph/Disclosure/Proof) → **Backend Interface** (`commit`, `query`, `verify`, `disclose`, `revoke`) → **Confidential Execution Layer** (Aztec active, Midnight on hold) → **Settlement** (Ethereum) → **Execution / Interoperability Layer** (other chains and local storage). Each layer depends only on the interface of the layer beneath it.

## 12.4 Data flow

A typical write flow: the application calls the SDK → the SDK constructs a signed asset/event/claim → the core engine appends it to the graph and computes hashes/Merkle roots → the backend `commit` anchors the commitment (through the confidential backend, or locally, or to a mirror chain) → a `Receipt` is returned. A typical disclosure flow: a viewer requests fields → the Disclosure Engine evaluates policy → the Proof Engine (via the confidential backend) produces a ZK proof over the disclosed fields and Merkle root → a `DisclosureReceipt` is returned that any third party can verify.

## 12.5 The anchor pattern

The distinguishing pattern is *generate locally, commit through the confidential backend, return a commitment*:

```text
Generate provenance locally
        ↓
Commit proof/commitment via Aztec
        ↓
Return commitment + proof to the application
```

This lets applications on any chain obtain confidential provenance without migrating.

## 12.6 Per-ecosystem flows

```text
Solana asset      Solana → Sigil → Aztec commitment → proof → verification
Ethereum asset    Ethereum asset → Sigil → Aztec commitment → proof → verification
AI inference      Model output → Sigil → Aztec → confidential provenance
ESG evidence      Factory evidence → Sigil → Aztec → regulator receives ZK proof
Supply chain      Coffee: harvest → transport → processing → Sigil graph → Aztec commitment
```

In each case the application substrate differs, but the trust root is the same.

## 12.7 Trust boundaries

The boundary that matters is between what Sigil guarantees cryptographically and what it delegates. Signature validity, event-history tamper-evidence, Merkle inclusion, and (in the confidential backend) policy-faithful disclosure are guaranteed cryptographically and do not depend on any backend's honesty. Content *truthfulness*, network liveness, key secrecy, and policy *enforcement on non-ZK backends* are outside the cryptographic boundary and are addressed in the [Security Model](#25-security-model).

## 12.8 Backend interface

Every backend — anchor or execution — implements the same five methods:

- `commit(items)` → `Receipt[]`: record provenance items and return proofs of inclusion.
- `query(filter)` → `ProvenanceItem[]`: retrieve items matching a filter, respecting disclosure.
- `verify(receipt)` → `VerificationResult`: verify a previously committed item.
- `disclose(request)` → `DisclosureReceipt`: produce a selective-disclosure proof under a policy.
- `revoke(attestationId)` → `Receipt`: mark an attestation revoked with a signed statement.

## 12.9 Current Implementation Status

Sigil is at an early (v0.1) stage. This PRD describes the target architecture; the table below states honestly what exists in the reference codebase today so readers can distinguish shipped capability from planned capability.

| Area | Status | Notes |
|---|---|---|
| `@sigil/core` types & interfaces | ✅ Implemented | Full type model; the stable contract layer. |
| `@sigil/crypto` (Ed25519, SHA-256, `did:sigil`, Merkle) | ✅ Implemented | Real, unit-tested crypto; strongest area. |
| `@sigil/graph` (SQLite store, DOT/JSON-LD export) | ✅ Implemented | Fixed 4-table schema (asset/event/claim/attestation), not yet an arbitrary node/edge graph. |
| `@sigil/policy` (5-tier disclosure, default-deny) | ✅ Implemented | Well-tested and **wired into the SDK**; disclosure is policy-gated but not yet cryptographically enforced (`ProofType.None`) pending the confidential backend. |
| `@sigil/backend-local` | ✅ Implemented | `commit`/`query`/`disclose` (policy-gated)/`revoke`/`verify` all implemented; `verify` checks the receipt against committed state and returns the provenance chain. |
| `@sigil/sdk` | ✅ Implemented | Composes crypto+graph+policy+local backend; policy engine wired into disclosure; identity initialization is race-safe; typecheck/build/tests green. Still uses in-memory SQLite only (durable store planned). |
| `@sigil/cli` | ⚠️ Partial | Command surface exists; each invocation uses a fresh in-memory store, so state does not persist across calls yet; no tests yet. |
| Merkle → receipt/anchor integration | 🔲 Planned | Merkle trees exist but are not yet wired into receipts or on-chain anchoring. |
| Zero-knowledge proofs | 🔲 Planned | `ProofType.AztecZk`/`ProofType.MidnightZk`/`EvidenceType.ZkProof` are declared; no ZK code yet. |
| `@sigil/backend-aztec` (confidential backend) | 🔲 Planned (v0.3) | Does not exist on disk yet. |
| `noir` (Aztec.nr / Noir circuits) | 🔲 Planned (v0.3) | Does not exist on disk yet. |
| `@sigil/backend-midnight` (confidential backend) | ⏸ On hold (v0.6+) | Deferred pending Midnight ecosystem maturity. |
| `compact` (Midnight Compact circuits) | ⏸ On hold (v0.6+) | Deferred alongside the Midnight backend. |
| Execution adapters (Ethereum/Solana/Cardano/Avalanche/Hyperledger) | 🔲 Planned | Interface defined; adapters not yet built. |
| secp256k1 | 🔲 Planned | Declared in `ProofType`; not implemented. |
| Query engine (temporal/filtered) | ⚠️ Partial | `query` is asset-id-centric; `QueryFilter` time/type/visibility fields not yet honored. |

Roadmap items in [§29](#29-roadmap) are labeled accordingly.

---

# 13. Provenance Graph Model

## Nodes

Nodes are the four core entities — **Asset**, **Event**, **Claim**, **Attestation** — plus **Evidence** as a supporting node. Each node is content-hashed and, where applicable, signed.

## Edges

Edges are typed relationships: an Asset *has* Events; an Event *references* Claims; Claims are *attested by* Attestations; Evidence *supports* Claims. Higher-order edges include `derivedFrom`, `composedOf`, `attestedBy`, and `references`.

## Events

Events form the append-only backbone of each asset's history. Each event carries an issuer DID, a timestamp, a proof, and optional metadata, and (in the target model) references its predecessor to form a causal chain.

## Relationships

Relationships turn the linear event chain into a directed graph, enabling multi-asset lineage (derivation, composition) and cross-entity links (attestation, evidence support).

## Graph semantics

The graph `G = (V, E)` supports queries impossible over flat ledgers: reverse traversal (trace all inputs of an asset to origin), forward impact analysis (find all assets affected by a compromised component), and predicate-filtered traversal (verify every node on a certification path has valid attestations).

## Versioning

Updates never mutate. A new version is a new event/claim referencing its predecessor, so every historical state remains reconstructable and every change is attributable.

## Event sourcing

An asset's state at time *t* is the ordered set of all its events with timestamp ≤ *t*. This yields immutability (tamper-evidence), replayability (reconstruct state from genesis), and auditability (every transition has a signed event).

## Temporal provenance

Because events are timestamped and ordered, Sigil supports point-in-time queries ("what did this asset's provenance look like on date X") and interval queries over an asset's history.

---

# 14. Data Model

The schemas below reflect `@sigil/core` exactly.

## Asset schema

```ts
interface Asset {
  id: AssetId;
  type: string;
  owner: DID;
  metadata: Record<string, unknown>;
  visibility: VisibilityLevel; // Private(0) … Public(4)
  createdAt: Timestamp;
}
```

## Claim schema

```ts
interface Claim {
  id: ClaimId;
  subject: string;
  predicate: string;
  object: string;
  issuer: DID;
  signature: Signature;
  proof: Proof;
  visibility: VisibilityLevel;
  evidence?: Evidence[];
}
```

## Event schema

```ts
interface Event {
  id: EventId;
  assetId: AssetId;
  type: string; // created | transferred | certified | inspected | revoked | updated | custom
  issuer: DID;
  timestamp: Timestamp;
  proof: Proof;
  metadata?: Record<string, unknown>;
}
```

## Evidence schema

```ts
interface Evidence {
  type: EvidenceType; // zk-proof | pdf | ipfs-cid | sensor-data | signature | external-ref | image
  value: string;
  metadata?: Record<string, unknown>;
}
```

## Policy schema

```ts
interface Policy {
  id: PolicyId;
  assetType?: string;
  rules: PolicyRule[]; // { field: string; visibleAt: VisibilityLevel }
}
```

## Attestation schema

```ts
interface Attestation {
  id: AttestationId;
  claimId: ClaimId;
  issuer: DID;
  proof: Proof;
  status: AttestationStatus; // active | revoked | expired
  expiresAt?: Timestamp;
}
```

## Metadata

Metadata is an open `Record<string, unknown>` on assets and events, allowing domain-specific fields without schema changes. Disclosure policies operate at the field level within metadata.

## Extensions

Domain schemas (AI model, dataset, carbon credit, batch lot) are layered on top of `type` + `metadata` conventions and validated by pluggable evidence/policy plugins rather than hard-coded into the core.

---

# 15. Cryptographic Model

## Hashing

All content is hashed with **SHA-256**. Fields are serialized with a deterministic **JSON Canonicalization Scheme (JCS)** before hashing so that logically identical objects produce identical hashes.

## Signatures

Claims, events, and attestations are signed with **Ed25519** (RFC 8032). The signing pipeline is: canonicalize → `h = SHA-256(serialize(fields))` → `σ = Ed25519Sign(sk, h)`. Verification recomputes `h` and checks `σ` against the signer's public key, so any modification invalidates the signature. (`secp256k1` is declared in the type model and planned but not yet implemented.)

## Merkle proofs

Sigil maintains two Merkle trees per asset — an **event tree** and a **claim tree** — both using SHA-256. An inclusion proof is the set of sibling hashes on the path from a leaf to the root; verification reconstructs the root and compares. Proof size is `O(log n)` — roughly 256 bytes for up to a million leaves — enabling offline inclusion verification without the full log.

## Zero-knowledge proofs

In the confidential backend, selective disclosure is enforced by a zero-knowledge proof `Π_ZK` attesting that: (1) the claim is valid (signature verified), (2) the claim is included in the asset's claim Merkle tree, (3) the disclosed fields satisfy the policy, and (4) undisclosed fields remain private witnesses. The verifier receives `Π_ZK`, the disclosed values, and the Merkle root, and confirms authenticity without learning anything about hidden fields. *(Planned — see [§12.9](#129-current-implementation-status).)*

## Commitments

Policy `commit` actions produce **Pedersen commitments**, allowing a value to be committed publicly and selectively opened later via proof, without revealing it at disclosure time.

## Anchoring

Merkle roots and commitments are anchored to the configured backend. In the confidential backend this is a confidential anchor with ZK verification; on execution chains it can be a public mirror; locally it is a signed store entry. Anchoring enables verification independent of the storage operator.

## Verification

Verification is deterministic and independently runnable: recompute hashes, check signatures, verify Merkle inclusion, and — where present — verify the ZK proof against the anchored root. No step requires trusting Sigil's own infrastructure.

---

# 16. Policy & Selective Disclosure

## Access policies

A policy is a JSON document scoped to an `assetType`, listing field-level rules. Each rule binds a `field` to the minimum `VisibilityLevel` (`visibleAt`) at which it becomes visible. Policies are data — versionable, auditable, and composable.

## Confidentiality levels

Five levels form an inclusive ladder, mirroring `VisibilityLevel`:

| Level | Value | Typical disclosure |
|---|---|---|
| Private | 0 | No fields (existence may be committed or hidden) |
| Partner | 1 | Identifiers/timestamps for operational integration |
| Auditor | 2 | Audit-relevant fields (quantities, certifications, trails) |
| Regulator | 3 | Regulatory-mandated fields (superset of auditor + compliance metadata) |
| Public | 4 | All non-sensitive fields |

Each level inherits the visibility of those below it.

## Disclosure rules

Beyond the level ladder, the richer policy model supports four **actions** per field: `reveal` (return plaintext), `redact` (return `null`), `hash` (return SHA-256 for integrity without disclosure), and `commit` (return a Pedersen commitment for later opening). The default action for unmatched fields is `redact` — **default-deny**.

## Attribute-based disclosure

Rule conditions evaluate against viewer attributes — role, organization, DID, and presented Verifiable Credentials — so disclosure can depend on *who* is asking, not just a static level.

## Regulator access

Regulators receive a Regulator-level disclosure plus, from the confidential backend, a ZK proof that the disclosed compliance fields faithfully reflect the underlying record — satisfying mandates without exposing unrelated confidential data.

## Auditor access

Auditors receive Auditor-level fields and can independently verify signatures, Merkle inclusion, and (where present) ZK proofs, without trusting the data holder.

## Public access

Public disclosure exposes only fields explicitly marked visible at level 4 — suitable for consumer transparency and open-data use — while everything else remains confidential by default.

---

# 17. Plugin Architecture

Sigil exposes eight plugin categories, each defined by a TypeScript interface, connected to the core engine through a common registration model. This enables independent development and a marketplace of interchangeable components.

## Storage plugins

Implement `GraphStore` (put/get for assets, events, claims, attestations; `traverse`). Examples: SQLite (shipping), PostgreSQL, in-memory, distributed stores.

## Backend plugins

Implement `Backend` (`commit`/`query`/`verify`/`disclose`/`revoke`). Includes the confidential backends (Aztec, Midnight), execution-chain adapters, local, and mock.

## Identity plugins

DID resolvers and key managers implementing `CryptoProvider` and resolution of `did:sigil` and other DID methods.

## Policy plugins

Alternative `PolicyEngine` implementations — different rule languages, condition evaluators, or ZK-circuit compilers.

## Proof plugins

ZK proof generators and verifiers, signature schemes, and commitment schemes plugged into the Proof Engine.

## Evidence plugins

Content-addressable stores and integrity verifiers for evidence types (files, IPFS, sensor data, images, external references).

## Visualization plugins

Renderers for provenance graphs and timelines — e.g. the shipping DOT and JSON-LD exporters, plus future interactive views.

## Query plugins

Structured and graph-traversal query engines, including temporal and analytics queries over the provenance graph.

---

# 18. Confidential Execution & Interoperability Layers

*(This section corresponds to "Backend Adapters" in the original outline, retitled to reflect that the confidential layer is pluggable — Sigil owns the provenance model, and the confidential network beneath it is replaceable.)*

## Aztec — the confidential backend (active)

Aztec is the current root of confidentiality. It provides commitment anchoring, zero-knowledge proof generation and verification, and Noir-compiled selective-disclosure circuits. Policies compile to circuit constraints: a `reveal` rule constrains the revealed value to match the committed value at a position, a `hash` rule constrains correct hashing, and a `redact` rule contributes no constraint. Aztec then emits a single ZK proof that all policy rules were applied exactly — no more, no less.

Two properties make it the first target: private functions execute **client-side in the PXE**, so undisclosed fields never leave the holder's machine to reach a third-party prover; and it settles to **Ethereum**, which brings the identity, attestation, and wallet standards Sigil interoperates with. *(Adapter is planned for v0.3; see [§12.9](#129-current-implementation-status) and [RFC 0005](RFC/0005-aztec-adapter.md).)*

## Midnight — second confidential backend (on hold)

Midnight's Compact/Kachina model maps onto the same constraint mapping and would emit an equivalent `Π_ZK`. It is **on hold**, not discarded: its developer ecosystem, wallets, and identity/attestation integrations are less mature than Ethereum's today. Revisit at v0.6+; see [RFC 0003](RFC/0003-midnight-adapter.md).

Keeping a second backend specified is what makes the confidential layer pluggable in fact rather than in claim — and it is why an ecosystem setback for either network is a backend swap for Sigil, not a redesign.

## Settlement

Ethereum, beneath Aztec: where the confidential backend's state and proofs land, giving disclosures an L1-verifiable path. This is a distinct role from Ethereum's appearance as an execution adapter below.

## Execution / Interoperability adapters

These are where applications connect. Each commits *through* the confidential backend via Sigil rather than serving as an independent root of trust.

- **Ethereum** — public anchoring/mirroring for EVM-native applications (distinct from its settlement role above).
- **Solana** — high-throughput application substrate relying on the confidential backend for confidentiality.
- **Cardano** — UTXO-based anchoring/mirroring.
- **Avalanche** — subnet/app-chain integration.
- **Hyperledger** — enterprise/permissioned integration where a consortium already exists.

## Local

The `@sigil/backend-local` adapter (shipping) stores everything in the SQLite graph store for development, testing, and local-first deployments — no external anchor required.

## Mock backend

A deterministic in-memory backend for unit tests and examples, exercising the same five-method interface without side effects.

---

# 19. Identity & Credentials

## DID

Identities are W3C DIDs using a custom `did:sigil` method derived from an Ed25519 public key: `did:sigil:<hex(sha256(pk))>`. The DID resolves to a document containing the public key, verification methods, and service endpoints.

## Verifiable Credentials

Sigil consumes W3C Verifiable Credentials to establish issuer and viewer attributes (role, organization, accreditation) that disclosure policies evaluate against.

## Organizations

Organizations are DID-identified agents that own assets and issue claims/attestations, and whose accreditations can be expressed as credentials.

## Delegation

Delegation (planned as part of a full `did:sigil` method) lets an organization authorize agents to issue claims on its behalf, with the delegation itself recorded as verifiable provenance.

## Revocation

Attestations carry a `status` (`active`/`revoked`/`expired`) and revocation is a signed, first-class operation (`revoke`), so consumers can always determine current validity. Key and credential revocation integrate with DID document status endpoints.

---

# 20. Evidence Framework

Evidence objects support claims and are content-addressed by SHA-256, so modifying evidence breaks any claim referencing it. Supported `EvidenceType`s:

## Files

Arbitrary documents referenced by content hash, stored locally or in object storage.

## IPFS

Content-addressed evidence via `ipfs-cid`, where the CID is both the retrieval key and the integrity fingerprint.

## Images

Photographic evidence (`image`) — inspection photos, product images — bound by hash.

## Sensor data

`sensor-data` from IoT devices and instruments (temperature, GPS, meter readings) captured as signed evidence.

## PDFs

`pdf` certificates, audit reports, and compliance documents.

## AI outputs

Model outputs and evaluation artifacts captured as evidence for AI-model provenance claims.

## Zero-knowledge proofs

`zk-proof` evidence — proofs generated in the confidential backend that a statement about hidden data holds.

## External references

`external-ref` pointers to systems of record outside Sigil, bound by hash/URI for integrity.

---

# 21. Query Engine

## Graph traversal

Traverse an asset's `ProvenanceChain` (asset + events + claims + attestations), following typed edges for lineage and composition. *(Shipping today for asset-centric traversal; broader graph queries planned.)*

## Lineage

Reverse traversal to trace an asset's inputs back to their origins — e.g. a finished product back to raw materials and their certifications.

## Verification

Query-time verification that returns a `VerificationResult` (validity, chain, errors) by checking signatures, chain integrity, and (target) Merkle/ZK proofs.

## Audit queries

Filtered retrieval for auditors — claims by issuer, attestations by status, evidence by type — at the appropriate disclosure level.

## Historical queries

Point-in-time reconstruction of an asset's state from its event log.

## Temporal queries

Interval and ordering queries over timestamps (`since`/`until` in `QueryFilter`). *(Filter fields are defined in the type model; full honoring is planned — see [§12.9](#129-current-implementation-status).)*

## Provenance analytics

Aggregate queries — impact analysis, certification coverage, attestation freshness — exposed via query plugins.

---

# 22. SDK & Developer Experience

## TypeScript SDK

`@sigil/sdk` is the primary interface: a `Sigil` class with `asset`, `event`, `claim`, and `graph` sub-APIs plus `attest`, `verify`, `disclose`, and `revoke`. It composes crypto, graph, policy, and a backend behind a fluent surface. IDs are ULIDs.

## Rust SDK

Planned. The architecture keeps `@sigil/core` interfaces stable specifically so a performance-critical Rust core (with Wasm bindings) can replace the reference engine without breaking developers.

## Python SDK

Planned bindings for data-science and research workflows (dataset/AI-model provenance).

## Go SDK

Planned bindings for backend and infrastructure integrations.

## CLI

`@sigil/cli` exposes `init`, `asset`, `event`, `claim`, `attest`, `verify`, `disclose`, `graph`, and `backend` commands, configured via `.sigilrc`. *(Persistence across invocations is a tracked improvement — see [§12.9](#129-current-implementation-status).)*

## Examples

A coffee supply-chain example (harvest → process → certify → export → import → roast → package → sell) demonstrates end-to-end provenance with selective disclosure. *(Planned under `examples/coffee`.)*

## Tutorials

Progressive guides from "record your first asset" to "compile a disclosure policy to a Noir circuit," maintained alongside the SDK docs.

---

# 23. APIs

## REST

A resource-oriented HTTP API over assets, events, claims, attestations, disclosures, and verification — for language-agnostic integration. *(Planned; the SDK is the current entry point.)*

## GraphQL

A graph-shaped API well suited to lineage and traversal queries over the provenance graph. *(Planned.)*

## gRPC

A high-performance, strongly-typed API for service-to-service integration and the future Rust core. *(Planned.)*

## Event streaming

A subscription API for provenance events (new claims, attestations, revocations) enabling reactive integrations. *(Planned.)*

## Webhooks

Outbound notifications on provenance changes (e.g. an attestation revoked, a disclosure issued) for integration with external workflows. *(Planned.)*

---

# 24. Storage Layer

## Graph database

The logical model is a provenance graph. The shipping implementation is a SQLite-backed store with a fixed asset/event/claim/attestation schema; a generalized node/edge graph store is planned.

## SQLite

`@sigil/graph` uses `better-sqlite3` for synchronous, in-process storage — ideal for embedded and local-first deployments and for testing.

## PostgreSQL

A planned storage plugin for server deployments needing concurrency, replication, and larger datasets.

## IPFS

Content-addressable storage for evidence artifacts, referenced from claims by CID.

## Object storage

S3-compatible object storage as an evidence backend for large files, referenced by hash.

## Caching

A caching layer for hot assets, traversal results, and verification outcomes to meet latency targets. *(Planned.)*

---

# 25. Security Model

## Threat model

Sigil assumes storage operators and network intermediaries may be curious or malicious. Its cryptographic guarantees — signature validity, tamper-evident history, Merkle inclusion, and policy-faithful disclosure in the confidential backend — hold **without** trusting any backend's honesty. Explicitly *out of scope*: the truthfulness of claim *content* (Sigil verifies signatures, not facts), backend network liveness, private-key secrecy, and policy *enforcement* on non-ZK backends (which depends on that backend's integrity).

## Authentication

All actors are DID-identified; every claim, event, and attestation is signed. Authentication is cryptographic, not session-based.

## Authorization

Authorization for disclosure is policy-driven and default-deny: a viewer sees a field only if a rule explicitly grants it at the viewer's level with satisfied conditions.

## Replay protection

Events and claims carry timestamps and unique (ULID) identifiers; Merkle anchoring binds them to a specific history, so replays are detectable against the anchored root.

## Key management

Ed25519 keys are generated per RFC 8032. Key custody integrates with external key managers/wallets; key rotation and recovery are part of the planned full `did:sigil` method.

## Audit logging

The event-sourced log is itself the audit trail: append-only, signed, and replayable. Disclosure operations emit `DisclosureReceipt`s that record who received which fields when.

## Privacy guarantees

Confidentiality is default. In the confidential backend, non-interference is enforced cryptographically — a viewer at a lower level cannot learn anything about higher-level fields — and this property is a target for formal verification of the policy engine.

---

# 26. Standards & Interoperability

## W3C PROV

Sigil's Asset/Event/Claim map onto PROV's Entity/Activity/attribution model, extended with cryptographic anchoring, event-sourcing, and policy-driven disclosure that PROV leaves unspecified.

## DID Core

Identities follow W3C DID Core via the `did:sigil` method.

## Verifiable Credentials

Viewer/issuer attributes and accreditations are expressed as W3C Verifiable Credentials.

## JSON-LD

The graph exports to JSON-LD (`@context` at `https://sigil.sh/ns/`) for semantic interoperability.

## SPDX

Software provenance interoperates with SPDX SBOM documents.

## CycloneDX

Sigil consumes/produces CycloneDX SBOMs for software-supply-chain provenance.

## SLSA

Build provenance aligns with the SLSA levels for supply-chain integrity.

## OpenTelemetry

Runtime and pipeline provenance can ingest OpenTelemetry signals as evidence.

## OCI Artifacts

Container and artifact provenance interoperates with OCI artifact references.

---

# 27. Reference Applications

## ESG compliance

Prove emissions/offset and recycled-content claims to regulators and auditors while keeping supplier and pricing data confidential — aligned to EU DPP, CSRD, and SEC climate rules.

## Supply chain provenance

End-to-end traceability (e.g. coffee, pharma, minerals) with per-tier confidentiality between competing suppliers.

## AI model lineage

Prove training-data licensing, evaluation results, and model-card claims without publishing the training set — aligned to the EU AI Act and NIST AI RMF.

## Dataset provenance

Track dataset sources, transformations, and licensing for reproducibility and compliance, with selective disclosure of embargoed data.

## Scientific research

Link datasets, methods, instruments, and results into verifiable research provenance supporting reproducibility and integrity.

## Healthcare

Provenance for clinical data, devices, and pharmaceuticals with strict confidentiality and regulator-grade disclosure.

## Digital identity

Bind credentials and attestations to DIDs, using provenance to record issuance, delegation, and revocation.

## Carbon credits

Prove an offset's issuance and non-double-counting without revealing commercial terms.

## Manufacturing

Digital-thread provenance across multi-tier suppliers with confidential per-supplier data.

## Software supply chain

Prove a dependency was audited without revealing the full dependency graph or findings, interoperating with SLSA/SPDX/CycloneDX.

---

# 28. Deployment Models

## Embedded library

Sigil runs in-process via the SDK with a local SQLite store — the simplest, local-first deployment.

## Standalone server

A single-node service exposing REST/GraphQL/gRPC over a shared store. *(Planned once the API layer ships.)*

## Cloud service

A managed multi-tenant deployment with hosted storage and anchor connectivity.

## Kubernetes

Containerized deployment with horizontally scaled query/API tiers and a shared/sharded store.

## Edge

Lightweight edge deployment (Wasm/Rust core) for capturing provenance close to sensors and devices.

## Enterprise deployment

On-prem or VPC deployment with enterprise key management, audit logging, SSO-bound DIDs, and permissioned execution adapters (e.g. Hyperledger) committing through the confidential backend.

---

# 29. Roadmap

Milestones are directional. v0.1 core primitives exist today (see [§12.9](#129-current-implementation-status)); everything from the confidential backend onward is planned.

## v0.1 — Core provenance engine *(in progress)*

Core types, crypto (Ed25519/SHA-256/`did:sigil`/Merkle), SQLite graph store, policy engine, local backend, SDK, CLI. Harden the SDK (fix the `policyEngine` wiring, add persistence).

## v0.2 — Graph engine

Generalized node/edge graph store, full temporal/filtered queries, Merkle-into-receipt integration, richer traversal and analytics.

## v0.3 — Aztec integration *(Confidential Backend)*

Implement `@sigil/backend-aztec` (`aztec.js`) and the `noir` circuits: commitment anchoring, client-side ZK proof generation/verification in the PXE, policy-to-circuit compilation, Ethereum settlement path. The Midnight backend (`@sigil/backend-midnight`, `compact`) stays specified but on hold until v0.6+.

## v0.4 — Selective disclosure

Wire the policy engine into the SDK end-to-end; cryptographically enforced disclosure with ZK receipts; the four disclosure actions (reveal/redact/hash/commit) fully realized.

## v0.5 — Multi-backend support

Execution/interoperability adapters (Ethereum, Solana, Cardano, Avalanche, Hyperledger), cross-chain anchoring through the confidential backend, backend selection at runtime.

## v1.0 — Production release

Hardened crypto, stable APIs (REST/GraphQL/gRPC), full docs, reference applications, security review, deployment tooling.

## v2.0 — Distributed provenance network

Replace the single-node store with a Byzantine-fault-tolerant provenance network preserving the client API; Rust core with Wasm; formal verification of the policy engine.

---

# 30. Success Metrics

## Developer adoption

Number of applications integrating the SDK; time-to-first-verifiable-graph; retention across versions.

## SDK downloads

Package download growth across `@sigil/*` on the registry.

## Integrations

Count of backend adapters, storage plugins, and domain schema libraries — first-party and community.

## Performance

Meeting or beating the [§8 targets](#performance-targets) on reference hardware, tracked in CI benchmarks.

## Ecosystem growth

Applications committing through Sigil's confidential backend; sibling ZKOS projects (Tirenor, Olwen) built on Sigil.

## Community contributions

External contributors, merged RFCs, and third-party plugins.

---

# 31. Risks

## Technical risks

Single-node SQLite has no replication or fault tolerance (availability, not integrity, is at risk); the reference engine is TypeScript and not suited to sub-millisecond hot paths (mitigated by the planned Rust core); the current graph is a fixed relational schema rather than a general graph.

## Cryptographic risks

ZK integration is unimplemented and non-trivial; Merkle anchoring is not yet wired into receipts; only Ed25519 exists today; key compromise enables impersonation. Mitigations: staged delivery, external security review before v1.0, and formal verification of the policy engine.

## Adoption risks

Provenance infrastructure faces a cold-start problem. Mitigation: strong DX, reference applications in high-demand regulated domains, and standards interoperability so Sigil complements rather than replaces existing tooling.

## Ecosystem risks

**Backend-portability risk.** Depending on any single confidential network for ZK creates an availability and ecosystem-risk dependency; if that network is unavailable or stalls, selective-disclosure ZK is unavailable. Mitigation: the confidential layer is pluggable by design and a second backend (Midnight, RFC 0003) stays specified rather than discarded; local/mirror backends cover non-confidential paths; Aztec's client-side PXE proving removes reliance on a third-party prover service.

## Regulatory risks

Evolving regulation (DPP, AI Act, SEC/CSRD) may shift requirements. Mitigation: policy-as-data and standards alignment so compliance mappings can evolve without core changes.

---

# 32. Open Questions

## Research questions

How to minimize ZK proving latency for large claim sets? Can non-interference of the policy engine be formally proven and mechanically checked? What is the right multi-prover architecture to reduce single-anchor dependence?

## Engineering questions

What is the migration path from the fixed relational schema to a general node/edge graph without breaking `@sigil/core`? How should the Rust core and TypeScript SDK share the ZK/proof boundary?

## Standardization questions

Which parts of Sigil's model should be proposed as extensions to W3C PROV or the VC ecosystem? How to standardize AI-model-lineage schemas?

## Governance questions

How are RFCs, plugin certification, and schema registries governed within ZKOS Labs and the wider community?

---

# 33. Future Research

## Confidential provenance

Deeper primitives for proving properties over provenance graphs without revealing structure.

## AI explainability

Verifiable links between model outputs, training data, and evaluation, supporting explainability and audit.

## Privacy-preserving compliance

Compiling regulatory requirements directly into disclosure circuits so compliance is provable by construction.

## Cross-chain provenance

Simultaneous anchoring/verification across multiple chains for redundancy and reduced single-chain trust.

## Decentralized trust

A Byzantine-fault-tolerant provenance network as public infrastructure (v2.0 direction).

## Zero-knowledge audit trails

Audit trails that are fully verifiable yet reveal nothing beyond the audited property.

## Provenance query optimization

Indexing and query planning for large confidential provenance graphs, including ZK-friendly query patterns.

---

# 34. Appendix

## Glossary

- **Anchor** — where trust is rooted (the active confidential backend; Aztec today).
- **Confidential backend** — the pluggable network that computes private state and generates proofs (Aztec active, Midnight on hold).
- **Settlement** — where the confidential backend's state and proofs land (Ethereum).
- **Adapter** — where applications connect (execution chains, local).
- **Asset / Event / Claim / Attestation / Evidence** — the core provenance entities.
- **Disclosure** — policy-permitted, proof-carrying revelation of a field subset.
- **Selective disclosure** — revealing some fields while cryptographically hiding others.
- **Trust anchor** — the confidential root for commitments, disclosure, and ZK verification.

## Acronyms

DID (Decentralized Identifier), VC (Verifiable Credential), ZK/ZKP (Zero-Knowledge Proof), SNARK/STARK, JCS (JSON Canonicalization Scheme), DPP (Digital Product Passport), ESPR, CSRD, SLSA, SBOM, SPDX, CycloneDX, DAG (Directed Acyclic Graph), BFT (Byzantine Fault Tolerance).

## References

See the founding paper, `paper/paper.tex` — *"Sigil: A Confidential Provenance Infrastructure with Backend-Agnostic Zero-Knowledge Selective Disclosure"* (ZKOS Labs) — and its bibliography for the full academic references (W3C PROV, Aztec/Noir/PLONK, Midnight/Kachina, SLSA, in-toto, Sigstore, and the ZK literature).

## Standards

W3C PROV, W3C DID Core, W3C Verifiable Credentials, JSON-LD, SPDX, CycloneDX, SLSA, OpenTelemetry, OCI Artifacts.

## Architecture diagrams

See [Appendix A](#appendix-a--ecosystem-architecture) and [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

## Sequence diagrams

Write and disclosure sequence flows are described in [§12.4–12.6](#124-data-flow) and expanded in [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

## Data schemas

Normative schemas are in [§14](#14-data-model) and [`docs/GRAPH_MODEL.md`](GRAPH_MODEL.md), sourced from `@sigil/core`.

## Example APIs

See [`docs/API.md`](API.md) for REST/GraphQL/gRPC sketches and [`docs/SDK.md`](SDK.md) for SDK examples.

## Example SDKs

See [`docs/SDK.md`](SDK.md) for the TypeScript SDK and CLI walkthroughs.

## Migration guide

Migration guidance (schema evolution, backend migration, Rust-core transition) will be maintained here as those capabilities land.

---

# Appendix A — Ecosystem Architecture

```text
               Applications
────────────────────────────────────

AI
ESG
Supply Chain
Identity
DeSci

────────────────────────────────────
             Sigil SDK
────────────────────────────────────

Claims
Evidence
Policies
Provenance Graph

────────────────────────────────────
        Sigil Core Engine
────────────────────────────────────

Graph Engine
Disclosure Engine
Proof Engine

────────────────────────────────────
   Confidential Execution Layer
────────────────────────────────────

⭐ Aztec (active)
   Midnight (on hold)

────────────────────────────────────
        Settlement Layer
────────────────────────────────────

Ethereum

────────────────────────────────────
   Execution / Interoperability Layer
────────────────────────────────────

Ethereum
Solana
Cardano
Avalanche
Hyperledger

────────────────────────────────────
      Cryptographic / Execution Infrastructure
────────────────────────────────────

Daemon · IPFS · Identity Providers

────────────────────────────────────
```

Everything ultimately commits through the active confidential backend, regardless of where the application runs — and which network occupies that layer is a configuration choice, not an architectural commitment.

## Companion Documents

This PRD is the top of a documentation set:

```text
docs/
├── PRD.md            # Product vision and requirements (this document)
├── ARCHITECTURE.md   # System architecture
├── GRAPH_MODEL.md    # Provenance graph specification
├── CRYPTOGRAPHY.md   # Cryptographic primitives and proof model
├── POLICY.md         # Policy engine and selective disclosure
├── BACKENDS.md       # Confidential backends, settlement, execution adapters
├── PLUGINS.md        # Plugin system
├── SDK.md            # SDK design and examples
├── API.md            # REST, GraphQL, gRPC specifications
├── ROADMAP.md        # Milestones and release plan
├── CONTRIBUTING.md   # Contributor guide
└── RFC/
    ├── 0001-graph-model.md
    ├── 0002-plugin-api.md
    ├── 0003-midnight-adapter.md      # on hold
    ├── 0004-selective-disclosure.md
    └── 0005-aztec-adapter.md
```
