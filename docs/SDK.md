# Sigil — SDK & Developer Experience

The TypeScript SDK (`@sigil/sdk`) is the primary way to build with Sigil. See also [PRD §22](PRD.md#22-sdk--developer-experience).

## 1. Install

```bash
pnpm add @sigil/sdk
```

## 2. The `Sigil` class

`Sigil` composes crypto, graph, policy, and a backend behind a fluent surface, with four sub-APIs and top-level operations:

```ts
import { Sigil } from "@sigil/sdk";

const sigil = new Sigil({ backend: "local" }); // "local" | "midnight" | "mock"

// Sub-APIs
sigil.asset   // create / get assets
sigil.event   // record / list events
sigil.claim   // make / get claims
sigil.graph   // traverse / export

// Top-level operations
sigil.attest(...)    // third-party counter-signature
sigil.verify(...)    // structural + cryptographic verification
sigil.disclose(...)  // selective disclosure
sigil.revoke(...)    // revoke an attestation
```

IDs are ULIDs. The current SDK uses an in-memory SQLite `LocalBackend`; durable storage and `midnight`/`mock` wiring are tracked (see [PRD §12.9](PRD.md#129-current-implementation-status)).

## 3. Example — coffee provenance

```ts
const sigil = new Sigil({ backend: "local" });

const lot = await sigil.asset.create({
  type: "batch-lot",
  owner: farmerDid,
  metadata: { origin: "Huila, CO", variety: "Caturra" },
  visibility: VisibilityLevel.Partner,
});

await sigil.event.record({ assetId: lot.id, type: "certified",
  metadata: { scheme: "FairTrade", cert: "FT-2026-0417" } });

const claim = await sigil.claim.make({
  subject: lot.id, predicate: "hasCertification", object: "FairTrade",
  visibility: VisibilityLevel.Auditor,
  evidence: [{ type: EvidenceType.Pdf, value: "<sha256>" }],
});

await sigil.attest(claim.id, certifierDid);

const chain = await sigil.graph.traverse(lot.id);   // ProvenanceChain
const result = await sigil.verify(lot.id);          // VerificationResult
```

## 4. Selective disclosure

```ts
const receipt = await sigil.disclose({
  assetId: lot.id,
  recipient: auditorDid,
  level: VisibilityLevel.Auditor,
  fields: ["origin", "cert"],
});
// receipt: DisclosureReceipt — disclosedFields + proof (ZK at the Midnight anchor)
```

## 5. Export

The graph exports to **DOT** (Graphviz) and **JSON-LD** (`@context` at `https://sigil.sh/ns/`) via the graph API.

## 6. CLI

`@sigil/cli` exposes the same capabilities from the terminal:

```bash
sigil init
sigil asset create --type batch-lot --owner <did>
sigil event record --asset <id> --type certified
sigil claim make --subject <id> --predicate hasCertification --object FairTrade
sigil attest --claim <id>
sigil verify --asset <id>
sigil disclose --asset <id> --recipient <did> --level auditor
sigil graph traverse --asset <id>
sigil backend status
```

Configured via `.sigilrc` (YAML). Cross-invocation persistence is a tracked improvement.

## 7. Future bindings

Rust (with a Wasm core), Python, and Go SDKs are planned atop the stable `@sigil/core` contracts.
