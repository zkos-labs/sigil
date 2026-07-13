import { describe, it, expect } from "vitest";
import { Sigil } from "../sigil.js";
import { VisibilityLevel, AttestationStatus } from "@sigil/core";

function makeConfig() {
  return { backend: "local" as const };
}

describe("Sigil", () => {
  it("should create an asset", async () => {
    const sigil = new Sigil(makeConfig());

    const asset = await sigil.asset.create({
      type: "product",
      owner: "did:sigil:alice",
    });

    expect(asset.id).toBeTruthy();
    expect(asset.type).toBe("product");
    expect(asset.owner).toBe("did:sigil:alice");
    expect(asset.createdAt).toBeGreaterThan(0);
  });

  it("should return null for a non-existent asset", async () => {
    const sigil = new Sigil(makeConfig());

    const result = await sigil.asset.get("nonexistent");

    expect(result).toBeNull();
  });

  it("should record an event for an asset", async () => {
    const sigil = new Sigil(makeConfig());

    const asset = await sigil.asset.create({
      type: "product",
      owner: "did:sigil:alice",
    });

    const event = await sigil.event.record(asset.id, "inspected", {
      inspector: "did:sigil:bob",
    });

    expect(event.id).toBeTruthy();
    expect(event.assetId).toBe(asset.id);
    expect(event.type).toBe("inspected");
    expect(event.metadata).toEqual({ inspector: "did:sigil:bob" });
  });

  it("should list events for an asset", async () => {
    const sigil = new Sigil(makeConfig());

    const asset = await sigil.asset.create({
      type: "product",
      owner: "did:sigil:alice",
    });

    await sigil.event.record(asset.id, "created", { step: 1 });
    await sigil.event.record(asset.id, "inspected", { step: 2 });

    const events = await sigil.event.list(asset.id);

    expect(events).toHaveLength(2);
    expect(events[0]!.type).toBe("created");
    expect(events[1]!.type).toBe("inspected");
  });

  it("should make and retrieve a claim", async () => {
    const sigil = new Sigil(makeConfig());

    const claim = await sigil.claim.make({
      subject: "asset-001",
      predicate: "certifiedBy",
      object: "did:sigil:inspector",
    });

    expect(claim.id).toBeTruthy();
    expect(claim.subject).toBe("asset-001");
    expect(claim.predicate).toBe("certifiedBy");

    const retrieved = await sigil.claim.get(claim.id);
    expect(retrieved).toBeTruthy();
    expect(retrieved!.id).toBe(claim.id);
  });

  it("should attest a claim", async () => {
    const sigil = new Sigil(makeConfig());

    const claim = await sigil.claim.make({
      subject: "asset-001",
      predicate: "certifiedBy",
      object: "did:sigil:inspector",
    });

    const attestation = await sigil.attest(claim.id);

    expect(attestation.id).toBeTruthy();
    expect(attestation.claimId).toBe(claim.id);
    expect(attestation.status).toBe(AttestationStatus.Active);
    expect(attestation.proof.type).toBeTruthy();
  });

  it("should complete a full real-world provenance workflow", async () => {
    const sigil = new Sigil(makeConfig());

    const asset = await sigil.asset.create({
      type: "product",
      owner: "did:sigil:alice",
      metadata: { name: "Widget", batch: "B-42" },
    });

    await sigil.event.record(asset.id, "manufactured", {
      factory: "Factory-1",
      timestamp: 1700000000,
    });

    await sigil.event.record(asset.id, "shipped", {
      carrier: "UPS",
      trackingId: "1Z999AA10123456784",
    });

    const claim = await sigil.claim.make({
      subject: asset.id,
      predicate: "hasQualityScore",
      object: "95",
      evidence: [],
    });

    const attestation = await sigil.attest(claim.id);

    const verification = await sigil.verify(asset.id);
    expect(verification.valid).toBe(true);
    expect(verification.chain.asset.type).toBe("product");
    expect(verification.chain.events).toHaveLength(2);

    const receipt = await sigil.disclose({
      assetId: asset.id,
      recipient: "did:sigil:auditor",
      level: VisibilityLevel.Auditor,
      fields: ["name", "batch"],
    });

    expect(receipt.assetId).toBe(asset.id);
    expect(receipt.recipient).toBe("did:sigil:auditor");
    expect(receipt.disclosedFields).toContain("name");
    expect(receipt.disclosedFields).toContain("batch");

    const revokeResult = await sigil.revoke(attestation.id);
    expect(revokeResult.id).toBe(attestation.id);
  });

  it("should traverse the full provenance chain", async () => {
    const sigil = new Sigil(makeConfig());

    const asset = await sigil.asset.create({
      type: "diamond",
      owner: "did:sigil:miner",
    });

    await sigil.event.record(asset.id, "mined");
    await sigil.event.record(asset.id, "graded");

    const claim = await sigil.claim.make({
      subject: asset.id,
      predicate: "hasGrading",
      object: "VS1",
    });

    await sigil.attest(claim.id);

    const chain = await sigil.graph.traverse(asset.id);

    expect(chain.asset.id).toBe(asset.id);
    expect(chain.events).toHaveLength(2);
    expect(chain.claims).toHaveLength(1);
    expect(chain.attestations).toHaveLength(1);
  });

  it("should export the provenance chain in DOT and JSON formats", async () => {
    const sigil = new Sigil(makeConfig());

    const asset = await sigil.asset.create({
      type: "diamond",
      owner: "did:sigil:miner",
    });

    await sigil.event.record(asset.id, "mined");

    const dot = await sigil.graph.export(asset.id, "dot");
    expect(dot).toContain("digraph Provenance");
    expect(dot).toContain("diamond");

    const json = await sigil.graph.export(asset.id, "json");
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed["@context"]).toBeTruthy();
    expect(parsed["@type"]).toBe("diamond");
  });

  it("should return a failing verification for non-existent asset", async () => {
    const sigil = new Sigil(makeConfig());

    const result = await sigil.verify("nonexistent");

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.code).toBe("ASSET_NOT_FOUND");
  });
});
