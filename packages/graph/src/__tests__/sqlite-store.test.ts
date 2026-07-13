import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { SqliteGraphStore } from "../sqlite-store.js";
import {
  VisibilityLevel,
  AttestationStatus,
  ProofType,
  EvidenceType,
  type Asset,
  type Event,
  type Claim,
  type Attestation,
} from "@sigil/core";

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "asset-001",
    type: "product",
    owner: "did:sigil:alice",
    metadata: { name: "Widget", version: 1 },
    visibility: VisibilityLevel.Public,
    createdAt: 1700000000,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-001",
    assetId: "asset-001",
    type: "created",
    issuer: "did:sigil:alice",
    timestamp: 1700000001,
    proof: {
      type: ProofType.Ed25519,
      value: "base64proof==",
      evidence: [{ type: EvidenceType.Signature, value: "sig-data" }],
    },
    metadata: { note: "initial creation" },
    ...overrides,
  };
}

function makeClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: "claim-001",
    subject: "asset-001",
    predicate: "certified_by",
    object: "ISO9001",
    issuer: "did:sigil:auditor",
    signature: {
      algorithm: "ed25519",
      signer: "did:sigil:auditor",
      value: "sig-value",
      signedAt: 1700000100,
    },
    proof: {
      type: ProofType.Ed25519,
      value: "proof-value",
    },
    visibility: VisibilityLevel.Auditor,
    evidence: [{ type: EvidenceType.Pdf, value: "ipfs://abc" }],
    ...overrides,
  };
}

function makeAttestation(overrides: Partial<Attestation> = {}): Attestation {
  return {
    id: "att-001",
    claimId: "claim-001",
    issuer: "did:sigil:auditor",
    proof: {
      type: ProofType.Ed25519,
      value: "att-proof",
    },
    status: AttestationStatus.Active,
    expiresAt: 1800000000,
    ...overrides,
  };
}

describe("SqliteGraphStore", () => {
  function createStore(): SqliteGraphStore {
    const db = new Database(":memory:");
    return new SqliteGraphStore(db);
  }

  describe("Asset CRUD", () => {
    it("putAsset and getAsset", async () => {
      const store = createStore();
      const asset = makeAsset();
      await store.putAsset(asset);

      const result = await store.getAsset("asset-001");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("asset-001");
      expect(result!.type).toBe("product");
      expect(result!.owner).toBe("did:sigil:alice");
      expect(result!.metadata).toEqual({ name: "Widget", version: 1 });
      expect(result!.visibility).toBe(VisibilityLevel.Public);
      expect(result!.createdAt).toBe(1700000000);
    });

    it("getAsset returns null for non-existent asset", async () => {
      const store = createStore();
      const result = await store.getAsset("nonexistent");
      expect(result).toBeNull();
    });

    it("putAsset rejects duplicate id", async () => {
      const store = createStore();
      await store.putAsset(makeAsset());
      await expect(store.putAsset(makeAsset())).rejects.toThrow();
    });
  });

  describe("Event CRUD", () => {
    it("putEvent and getEvent", async () => {
      const store = createStore();
      await store.putAsset(makeAsset());
      const event = makeEvent();
      await store.putEvent(event);

      const result = await store.getEvent("event-001");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("event-001");
      expect(result!.assetId).toBe("asset-001");
      expect(result!.type).toBe("created");
      expect(result!.issuer).toBe("did:sigil:alice");
      expect(result!.timestamp).toBe(1700000001);
      expect(result!.proof.type).toBe(ProofType.Ed25519);
      expect(result!.proof.value).toBe("base64proof==");
      expect(result!.proof.evidence).toEqual([{ type: "signature", value: "sig-data" }]);
      expect(result!.metadata).toEqual({ note: "initial creation" });
    });

    it("getEvent returns null for non-existent event", async () => {
      const store = createStore();
      const result = await store.getEvent("nonexistent");
      expect(result).toBeNull();
    });

    it("getEvents returns events for asset ordered by timestamp", async () => {
      const store = createStore();
      await store.putAsset(makeAsset());
      await store.putEvent(makeEvent({ id: "event-001", timestamp: 1700000001 }));
      await store.putEvent(makeEvent({ id: "event-002", assetId: "asset-001", timestamp: 1700000002 }));

      const events = await store.getEvents("asset-001");
      expect(events).toHaveLength(2);
      expect(events[0]!.id).toBe("event-001");
      expect(events[1]!.id).toBe("event-002");
    });

    it("getEvents returns empty array when no events", async () => {
      const store = createStore();
      const events = await store.getEvents("asset-001");
      expect(events).toEqual([]);
    });

    it("putEvent rejects duplicate id", async () => {
      const store = createStore();
      await store.putAsset(makeAsset());
      await store.putEvent(makeEvent());
      await expect(store.putEvent(makeEvent())).rejects.toThrow();
    });
  });

  describe("Graph traversal", () => {
    it("traverse returns full ProvenanceChain", async () => {
      const store = createStore();
      const asset = makeAsset();
      await store.putAsset(asset);

      const event = makeEvent();
      await store.putEvent(event);

      const claim = makeClaim();
      await store.putClaim(claim);

      const attestation = makeAttestation();
      await store.putAttestation(attestation);

      const chain = await store.traverse("asset-001");

      expect(chain.asset).not.toBeNull();
      expect(chain.asset.id).toBe("asset-001");
      expect(chain.events).toHaveLength(1);
      expect(chain.events[0]!.id).toBe("event-001");
      expect(chain.claims).toHaveLength(1);
      expect(chain.claims[0]!.id).toBe("claim-001");
      expect(chain.attestations).toHaveLength(1);
      expect(chain.attestations[0]!.id).toBe("att-001");
    });

    it("traverse returns empty chain for unknown asset", async () => {
      const store = createStore();
      const chain = await store.traverse("nonexistent");
      expect(chain.asset).toBeNull();
      expect(chain.events).toEqual([]);
      expect(chain.claims).toEqual([]);
      expect(chain.attestations).toEqual([]);
    });
  });

  describe("Claim CRUD", () => {
    it("putClaim and getClaim", async () => {
      const store = createStore();
      const claim = makeClaim();
      await store.putClaim(claim);

      const result = await store.getClaim("claim-001");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("claim-001");
      expect(result!.subject).toBe("asset-001");
      expect(result!.predicate).toBe("certified_by");
      expect(result!.object).toBe("ISO9001");
      expect(result!.issuer).toBe("did:sigil:auditor");
      expect(result!.signature.algorithm).toBe("ed25519");
      expect(result!.signature.signer).toBe("did:sigil:auditor");
      expect(result!.signature.value).toBe("sig-value");
      expect(result!.signature.signedAt).toBe(1700000100);
      expect(result!.proof.type).toBe(ProofType.Ed25519);
      expect(result!.proof.value).toBe("proof-value");
      expect(result!.visibility).toBe(VisibilityLevel.Auditor);
      expect(result!.evidence).toEqual([{ type: "pdf", value: "ipfs://abc" }]);
    });

    it("getClaim returns null for non-existent claim", async () => {
      const store = createStore();
      const result = await store.getClaim("nonexistent");
      expect(result).toBeNull();
    });

    it("getClaims returns claims by subject", async () => {
      const store = createStore();
      await store.putClaim(makeClaim({ id: "claim-001", subject: "asset-001" }));
      await store.putClaim(makeClaim({ id: "claim-002", subject: "asset-001", predicate: "verified_by" }));
      await store.putClaim(makeClaim({ id: "claim-003", subject: "asset-002" }));

      const claims = await store.getClaims("asset-001");
      expect(claims).toHaveLength(2);
      expect(claims[0]!.id).toBe("claim-001");
      expect(claims[1]!.id).toBe("claim-002");
    });

    it("getClaims returns empty array when no claims", async () => {
      const store = createStore();
      const claims = await store.getClaims("asset-001");
      expect(claims).toEqual([]);
    });

    it("putClaim rejects duplicate id", async () => {
      const store = createStore();
      await store.putClaim(makeClaim());
      await expect(store.putClaim(makeClaim())).rejects.toThrow();
    });
  });

  describe("Attestation CRUD", () => {
    it("putAttestation and getAttestation", async () => {
      const store = createStore();
      await store.putClaim(makeClaim());
      const attestation = makeAttestation();
      await store.putAttestation(attestation);

      const result = await store.getAttestation("att-001");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("att-001");
      expect(result!.claimId).toBe("claim-001");
      expect(result!.issuer).toBe("did:sigil:auditor");
      expect(result!.proof.type).toBe(ProofType.Ed25519);
      expect(result!.proof.value).toBe("att-proof");
      expect(result!.status).toBe(AttestationStatus.Active);
      expect(result!.expiresAt).toBe(1800000000);
    });

    it("getAttestation returns null for non-existent attestation", async () => {
      const store = createStore();
      const result = await store.getAttestation("nonexistent");
      expect(result).toBeNull();
    });

    it("getAttestationsForClaim returns attestations for claim", async () => {
      const store = createStore();
      await store.putClaim(makeClaim());
      await store.putAttestation(makeAttestation({ id: "att-001" }));
      await store.putAttestation(
        makeAttestation({ id: "att-002", status: AttestationStatus.Revoked }),
      );

      const atts = await store.getAttestationsForClaim("claim-001");
      expect(atts).toHaveLength(2);
    });

    it("getAttestationsForClaim returns empty array when no attestations", async () => {
      const store = createStore();
      const atts = await store.getAttestationsForClaim("claim-001");
      expect(atts).toEqual([]);
    });
  });
});
