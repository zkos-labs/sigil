import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { SqliteGraphStore } from "@sigil/graph";
import { Ed25519Provider } from "@sigil/crypto";
import { DefaultPolicyEngine } from "@sigil/policy";
import {
  AttestationStatus,
  ProofType,
  VisibilityLevel,
  type Asset,
  type Attestation,
  type Claim,
  type Event,
  type ProvenanceItem,
} from "@sigil/core";
import { LocalBackend } from "../local-backend.js";

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "asset-001",
    type: "product",
    owner: "did:sigil:alice",
    metadata: { name: "Widget", serial: "SN-001" },
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
      value: "proof-bytes",
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
    visibility: VisibilityLevel.Public,
    ...overrides,
  };
}

function makeAttestation(overrides: Partial<Attestation> = {}): Attestation {
  return {
    id: "attest-001",
    claimId: "claim-001",
    issuer: "did:sigil:regulator",
    proof: {
      type: ProofType.Ed25519,
      value: "attest-proof",
    },
    status: AttestationStatus.Active,
    ...overrides,
  };
}

function assetItem(asset: Asset): ProvenanceItem {
  return { type: "asset" as const, data: asset };
}

function eventItem(event: Event): ProvenanceItem {
  return { type: "event" as const, data: event };
}

function claimItem(claim: Claim): ProvenanceItem {
  return { type: "claim" as const, data: claim };
}

function attestationItem(attestation: Attestation): ProvenanceItem {
  return { type: "attestation" as const, data: attestation };
}

describe("LocalBackend", () => {
  let backend: LocalBackend;
  let graph: SqliteGraphStore;
  let crypto: Ed25519Provider;

  beforeEach(() => {
    const db = new Database(":memory:");
    graph = new SqliteGraphStore(db);
    crypto = new Ed25519Provider();
    backend = new LocalBackend({ graph, crypto });
  });

  describe("commit", () => {
    it("commits an asset and returns a receipt", async () => {
      const asset = makeAsset();
      const receipts = await backend.commit([assetItem(asset)]);

      expect(receipts).toHaveLength(1);
      expect(receipts[0]!.id).toBe("asset-001");
      expect(receipts[0]!.type).toBe("asset");
      expect(receipts[0]!.hash).toBeTruthy();
      expect(receipts[0]!.proof.type).toBe(ProofType.None);

      const stored = await graph.getAsset("asset-001");
      expect(stored).not.toBeNull();
      expect(stored!.type).toBe("product");
      expect(stored!.owner).toBe("did:sigil:alice");
      expect(stored!.metadata).toEqual({ name: "Widget", serial: "SN-001" });
    });

    it("commits an event and returns a receipt", async () => {
      const asset = makeAsset();
      const event = makeEvent();
      await backend.commit([assetItem(asset)]);
      const receipts = await backend.commit([eventItem(event)]);

      expect(receipts).toHaveLength(1);
      expect(receipts[0]!.id).toBe("event-001");
      expect(receipts[0]!.type).toBe("event");

      const stored = await graph.getEvent("event-001");
      expect(stored).not.toBeNull();
      expect(stored!.assetId).toBe("asset-001");
      expect(stored!.type).toBe("created");
    });

    it("commits a claim and returns a receipt", async () => {
      const asset = makeAsset();
      const claim = makeClaim();
      await backend.commit([assetItem(asset)]);
      const receipts = await backend.commit([claimItem(claim)]);

      expect(receipts).toHaveLength(1);
      expect(receipts[0]!.id).toBe("claim-001");
      expect(receipts[0]!.type).toBe("claim");

      const stored = await graph.getClaim("claim-001");
      expect(stored).not.toBeNull();
      expect(stored!.subject).toBe("asset-001");
    });

    it("commits an attestation and returns a receipt", async () => {
      const asset = makeAsset();
      const claim = makeClaim();
      const attestation = makeAttestation();
      await backend.commit([assetItem(asset), claimItem(claim)]);
      const receipts = await backend.commit([attestationItem(attestation)]);

      expect(receipts).toHaveLength(1);
      expect(receipts[0]!.id).toBe("attest-001");
      expect(receipts[0]!.type).toBe("attestation");

      const stored = await graph.getAttestation("attest-001");
      expect(stored).not.toBeNull();
      expect(stored!.claimId).toBe("claim-001");
      expect(stored!.status).toBe(AttestationStatus.Active);
    });

    it("commits multiple items in a single call", async () => {
      const asset = makeAsset();
      const event = makeEvent();
      const receipts = await backend.commit([
        assetItem(asset),
        eventItem(event),
      ]);

      expect(receipts).toHaveLength(2);
      expect(receipts[0]!.type).toBe("asset");
      expect(receipts[1]!.type).toBe("event");

      const storedAsset = await graph.getAsset("asset-001");
      const storedEvent = await graph.getEvent("event-001");
      expect(storedAsset).not.toBeNull();
      expect(storedEvent).not.toBeNull();
    });
  });

  describe("query", () => {
    it("queries an asset and its events by assetId", async () => {
      const asset = makeAsset();
      const event1 = makeEvent();
      const event2 = makeEvent({
        id: "event-002",
        type: "transferred",
        timestamp: 1700000002,
        issuer: "did:sigil:bob",
      });
      await backend.commit([
        assetItem(asset),
        eventItem(event1),
        eventItem(event2),
      ]);

      const results = await backend.query({ assetId: "asset-001" });

      const types = results.map((r) => r.type);
      expect(types).toContain("asset");
      expect(types).toContain("event");

      const assetResult = results.find((r) => r.type === "asset");
      expect(assetResult!.data).toEqual(asset);

      const events = results.filter((r) => r.type === "event");
      expect(events).toHaveLength(2);
    });

    it("returns an empty array for a non-existent assetId", async () => {
      const results = await backend.query({ assetId: "nonexistent" });
      expect(results).toEqual([]);
    });

    it("filters results by issuer", async () => {
      const asset = makeAsset({ owner: "did:sigil:alice" });
      const event1 = makeEvent({ issuer: "did:sigil:alice" });
      const event2 = makeEvent({
        id: "event-002",
        type: "inspected",
        timestamp: 1700000002,
        assetId: "asset-001",
        issuer: "did:sigil:bob",
        proof: { type: ProofType.Ed25519, value: "proof-bytes" },
      });
      await backend.commit([
        assetItem(asset),
        eventItem(event1),
        eventItem(event2),
      ]);

      const results = await backend.query({
        assetId: "asset-001",
        issuer: "did:sigil:alice",
      });

      expect(results.length).toBeGreaterThan(0);
      for (const item of results) {
        const data = item.data as { issuer?: string; owner?: string };
        const issuer = data.issuer ?? data.owner;
        expect(issuer).toBe("did:sigil:alice");
      }
    });
  });

  describe("verify", () => {
    it("verifies a committed asset and returns its provenance chain", async () => {
      const receipts = await backend.commit([
        assetItem(makeAsset()),
        eventItem(makeEvent()),
        claimItem(makeClaim()),
        attestationItem(makeAttestation()),
      ]);
      const assetReceipt = receipts.find((r) => r.type === "asset")!;

      const result = await backend.verify(assetReceipt);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.chain.asset.id).toBe("asset-001");
      expect(result.chain.events).toHaveLength(1);
      expect(result.chain.claims).toHaveLength(1);
      expect(result.chain.attestations).toHaveLength(1);
    });

    it("fails verification for a receipt with no committed entity", async () => {
      const receipt = {
        id: "asset-does-not-exist",
        type: "asset" as const,
        hash: "some-hash",
        proof: { type: ProofType.None, value: "" },
        timestamp: 1700000000,
      };

      const result = await backend.verify(receipt);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe("RECEIPT_NOT_FOUND");
    });

    it("verifies a committed claim in isolation", async () => {
      const claim = makeClaim();
      const [receipt] = await backend.commit([claimItem(claim)]);

      const result = await backend.verify(receipt!);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.chain.claims).toEqual([]);
    });
  });

  describe("disclose", () => {
    it("discloses requested fields from asset metadata without policy engine", async () => {
      const asset = makeAsset({
        metadata: { name: "Widget", serial: "SN-001", batch: "B-42" },
      });
      await backend.commit([assetItem(asset)]);

      const receipt = await backend.disclose({
        assetId: "asset-001",
        recipient: "did:sigil:viewer",
        level: VisibilityLevel.Partner,
        fields: ["name", "serial", "nonexistent"],
      });

      expect(receipt.assetId).toBe("asset-001");
      expect(receipt.recipient).toBe("did:sigil:viewer");
      expect(receipt.disclosedFields).toContain("name");
      expect(receipt.disclosedFields).toContain("serial");
      expect(receipt.disclosedFields).not.toContain("nonexistent");
      expect(receipt.disclosedFields).not.toContain("batch");
      expect(receipt.level).toBe(VisibilityLevel.Partner);
    });

    it("throws AssetNotFoundError for non-existent asset", async () => {
      await expect(
        backend.disclose({
          assetId: "nonexistent",
          recipient: "did:sigil:viewer",
          level: VisibilityLevel.Public,
          fields: ["name"],
        }),
      ).rejects.toThrow(/Asset not found/);
    });

    it("uses policy engine when available", async () => {
      const asset = makeAsset({
        metadata: { name: "Widget", serial: "SN-001" },
        visibility: VisibilityLevel.Partner,
      });
      await backend.commit([assetItem(asset)]);

      const policy = new DefaultPolicyEngine();
      const backendWithPolicy = new LocalBackend({ graph, crypto, policy });

      const receipt = await backendWithPolicy.disclose({
        assetId: "asset-001",
        recipient: "did:sigil:viewer",
        level: VisibilityLevel.Partner,
        fields: ["name", "serial"],
      });

      expect(receipt.disclosedFields).toContain("name");
      expect(receipt.disclosedFields).toContain("serial");
    });
  });

  describe("revoke", () => {
    it("revokes an attestation and updates its status", async () => {
      const asset = makeAsset();
      const claim = makeClaim();
      const attestation = makeAttestation({ status: AttestationStatus.Active });
      await backend.commit([
        assetItem(asset),
        claimItem(claim),
        attestationItem(attestation),
      ]);

      const receipt = await backend.revoke("attest-001");

      expect(receipt.id).toBe("attest-001");
      expect(receipt.type).toBe("attestation");

      const updated = await graph.getAttestation("attest-001");
      expect(updated).not.toBeNull();
      expect(updated!.status).toBe(AttestationStatus.Revoked);
    });

    it("throws BackendError for non-existent attestation", async () => {
      await expect(backend.revoke("nonexistent")).rejects.toThrow(
        /Attestation not found/,
      );
    });
  });
});
