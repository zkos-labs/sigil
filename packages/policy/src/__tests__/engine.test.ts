import { describe, it, expect } from "vitest"
import { DefaultPolicyEngine } from "../engine.js"
import { VisibilityLevel, ProofType } from "@sigil/core"
import type { Asset, Policy } from "@sigil/core"

function makeAsset(overrides?: Partial<Asset>): Asset {
  return {
    id: "asset-001",
    type: "widget",
    owner: "did:sigil:alice",
    metadata: {
      name: "Super Widget",
      price: 99,
      supplier: "ACME Corp",
      location: "Warehouse A",
      serialNumber: "SN-12345",
    },
    visibility: VisibilityLevel.Public,
    createdAt: 1700000000000,
    ...overrides,
  }
}

function makePolicy(rules: Policy["rules"]): Policy {
  return { id: "policy-001", rules }
}

const viewerDID = "did:sigil:viewer1"

describe("DefaultPolicyEngine", () => {
  const engine = new DefaultPolicyEngine()

  describe("evaluate", () => {
    it("includes id and type fields even when no policy rules match", async () => {
      const asset = makeAsset()
      const policy = makePolicy([])
      const result = await engine.evaluate(asset, viewerDID, policy, [])

      expect(result.fields.id).toBe("asset-001")
      expect(result.fields.type).toBe("widget")
    })

    it("returns null for fields when policy has no rules (default deny)", async () => {
      const asset = makeAsset()
      const policy = makePolicy([])
      const result = await engine.evaluate(asset, viewerDID, policy, [
        VisibilityLevel.Public,
      ])

      expect(result.fields.name).toBeNull()
      expect(result.fields.price).toBeNull()
      expect(result.fields.supplier).toBeNull()
    })

    it("shows fields to viewer whose highest role meets visibleAt", async () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Partner },
        { field: "price", visibleAt: VisibilityLevel.Partner },
      ])
      const result = await engine.evaluate(asset, viewerDID, policy, [
        VisibilityLevel.Partner,
      ])

      expect(result.fields.name).toBe("Super Widget")
      expect(result.fields.price).toBe(99)
      expect(result.fields.supplier).toBeNull()
    })

    it("hides fields from viewer whose highest role is below visibleAt", async () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Partner },
        { field: "price", visibleAt: VisibilityLevel.Partner },
      ])
      const result = await engine.evaluate(asset, viewerDID, policy, [
        VisibilityLevel.Private,
      ])

      expect(result.fields.name).toBeNull()
      expect(result.fields.price).toBeNull()
      expect(result.fields.id).toBe("asset-001")
      expect(result.fields.type).toBe("widget")
    })

    it("Auditor sees auditor-visible fields but not regulator-only fields", async () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Partner },
        { field: "price", visibleAt: VisibilityLevel.Auditor },
        { field: "supplier", visibleAt: VisibilityLevel.Regulator },
      ])
      const result = await engine.evaluate(asset, viewerDID, policy, [
        VisibilityLevel.Auditor,
      ])

      expect(result.fields.name).toBe("Super Widget")
      expect(result.fields.price).toBe(99)
      expect(result.fields.supplier).toBeNull()
    })

    it("Regulator sees regulator-visible fields", async () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Partner },
        { field: "price", visibleAt: VisibilityLevel.Auditor },
        { field: "supplier", visibleAt: VisibilityLevel.Regulator },
      ])
      const result = await engine.evaluate(asset, viewerDID, policy, [
        VisibilityLevel.Regulator,
      ])

      expect(result.fields.name).toBe("Super Widget")
      expect(result.fields.price).toBe(99)
      expect(result.fields.supplier).toBe("ACME Corp")
    })

    it("Public sees all fields", async () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Partner },
        { field: "price", visibleAt: VisibilityLevel.Partner },
        { field: "supplier", visibleAt: VisibilityLevel.Auditor },
        { field: "location", visibleAt: VisibilityLevel.Regulator },
        { field: "serialNumber", visibleAt: VisibilityLevel.Public },
      ])
      const result = await engine.evaluate(asset, viewerDID, policy, [
        VisibilityLevel.Public,
      ])

      expect(result.fields.name).toBe("Super Widget")
      expect(result.fields.price).toBe(99)
      expect(result.fields.supplier).toBe("ACME Corp")
      expect(result.fields.location).toBe("Warehouse A")
      expect(result.fields.serialNumber).toBe("SN-12345")
    })

    it("supports field-level granularity with mixed visibility", async () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Private },
        { field: "price", visibleAt: VisibilityLevel.Partner },
        { field: "supplier", visibleAt: VisibilityLevel.Auditor },
        { field: "location", visibleAt: VisibilityLevel.Regulator },
        { field: "serialNumber", visibleAt: VisibilityLevel.Public },
      ])
      const result = await engine.evaluate(asset, viewerDID, policy, [
        VisibilityLevel.Partner,
      ])

      expect(result.fields.name).toBe("Super Widget")
      expect(result.fields.price).toBe(99)
      expect(result.fields.supplier).toBeNull()
      expect(result.fields.location).toBeNull()
      expect(result.fields.serialNumber).toBeNull()
    })

    it("uses the highest role when viewer has multiple roles", async () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Partner },
        { field: "supplier", visibleAt: VisibilityLevel.Auditor },
      ])
      const result = await engine.evaluate(
        asset,
        viewerDID,
        policy,
        [VisibilityLevel.Private, VisibilityLevel.Auditor],
      )

      expect(result.fields.name).toBe("Super Widget")
      expect(result.fields.supplier).toBe("ACME Corp")
    })

    it("returns DisclosureResult with correct assetId and proof", async () => {
      const asset = makeAsset()
      const policy = makePolicy([])
      const result = await engine.evaluate(asset, viewerDID, policy, [])

      expect(result.assetId).toBe("asset-001")
      expect(result.proof.type).toBe(ProofType.None)
      expect(result.proof.value).toBe("disclosure-result")
    })

    it("handles empty viewerRoles as no access beyond id/type", async () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Private },
        { field: "price", visibleAt: VisibilityLevel.Partner },
      ])
      const result = await engine.evaluate(asset, viewerDID, policy, [])

      expect(result.fields.id).toBe("asset-001")
      expect(result.fields.type).toBe("widget")
      expect(result.fields.name).toBeNull()
      expect(result.fields.price).toBeNull()
    })

    it("treats fields with no matching rule as hidden", async () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Public },
      ])
      const result = await engine.evaluate(asset, viewerDID, policy, [
        VisibilityLevel.Public,
      ])

      expect(result.fields.name).toBe("Super Widget")
      expect(result.fields.price).toBeNull()
      expect(result.fields.supplier).toBeNull()
    })
  })

  describe("getVisibleFields", () => {
    it("returns all metadata keys when viewer role >= asset visibility", async () => {
      const asset = makeAsset({ visibility: VisibilityLevel.Partner })
      const fields = await engine.getVisibleFields(asset, viewerDID, [
        VisibilityLevel.Auditor,
      ])

      expect(fields).toContain("name")
      expect(fields).toContain("price")
      expect(fields).toContain("supplier")
      expect(fields).toContain("location")
      expect(fields).toContain("serialNumber")
    })

    it("returns empty array when viewer role < asset visibility", async () => {
      const asset = makeAsset({ visibility: VisibilityLevel.Auditor })
      const fields = await engine.getVisibleFields(asset, viewerDID, [
        VisibilityLevel.Partner,
      ])

      expect(fields).toEqual([])
    })

    it("returns empty array for empty viewerRoles", async () => {
      const asset = makeAsset({ visibility: VisibilityLevel.Partner })
      const fields = await engine.getVisibleFields(asset, viewerDID, [])

      expect(fields).toEqual([])
    })
  })
})
