import { describe, it, expect } from "vitest"
import { FieldEvaluator } from "../evaluator.js"
import { VisibilityLevel } from "@sigil/core"
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

describe("FieldEvaluator", () => {
  const evaluator = new FieldEvaluator()

  describe("evaluateField", () => {
    it("returns true for 'id' field regardless of policy", () => {
      const asset = makeAsset()
      const policy = makePolicy([])
      expect(evaluator.evaluateField(asset, viewerDID, policy, "id", [])).toBe(true)
    })

    it("returns true for 'type' field regardless of policy", () => {
      const asset = makeAsset()
      const policy = makePolicy([])
      expect(evaluator.evaluateField(asset, viewerDID, policy, "type", [])).toBe(true)
    })

    it("returns false when no rule matches the field", () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Public },
      ])
      expect(
        evaluator.evaluateField(asset, viewerDID, policy, "price", [
          VisibilityLevel.Public,
        ]),
      ).toBe(false)
    })

    it("returns true when viewer role meets the visibleAt requirement", () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Partner },
      ])
      expect(
        evaluator.evaluateField(asset, viewerDID, policy, "name", [
          VisibilityLevel.Auditor,
        ]),
      ).toBe(true)
    })

    it("returns false when viewer role is below visibleAt", () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Auditor },
      ])
      expect(
        evaluator.evaluateField(asset, viewerDID, policy, "name", [
          VisibilityLevel.Partner,
        ]),
      ).toBe(false)
    })

    it("higher role sees lower-role fields", () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Private },
        { field: "price", visibleAt: VisibilityLevel.Partner },
      ])
      const viewerRoles = [VisibilityLevel.Regulator]

      expect(evaluator.evaluateField(asset, viewerDID, policy, "name", viewerRoles)).toBe(true)
      expect(evaluator.evaluateField(asset, viewerDID, policy, "price", viewerRoles)).toBe(true)
    })

    it("lower role does NOT see higher-role fields", () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Partner },
        { field: "supplier", visibleAt: VisibilityLevel.Regulator },
      ])
      const viewerRoles = [VisibilityLevel.Partner]

      expect(evaluator.evaluateField(asset, viewerDID, policy, "name", viewerRoles)).toBe(true)
      expect(evaluator.evaluateField(asset, viewerDID, policy, "supplier", viewerRoles)).toBe(false)
    })

    it("uses highest role when viewer has multiple roles", () => {
      const asset = makeAsset()
      const policy = makePolicy([
        { field: "supplier", visibleAt: VisibilityLevel.Regulator },
      ])
      expect(
        evaluator.evaluateField(asset, viewerDID, policy, "supplier", [
          VisibilityLevel.Private,
          VisibilityLevel.Regulator,
        ]),
      ).toBe(true)
    })
  })

  describe("resolveDisclosureLevel", () => {
    it("returns Private for empty viewerRoles", () => {
      expect(evaluator.resolveDisclosureLevel(makeAsset(), viewerDID, [])).toBe(
        VisibilityLevel.Private,
      )
    })

    it("returns the highest role from viewerRoles", () => {
      expect(
        evaluator.resolveDisclosureLevel(makeAsset(), viewerDID, [
          VisibilityLevel.Partner,
          VisibilityLevel.Auditor,
          VisibilityLevel.Regulator,
        ]),
      ).toBe(VisibilityLevel.Regulator)
    })

    it("returns the single role when only one provided", () => {
      expect(
        evaluator.resolveDisclosureLevel(makeAsset(), viewerDID, [
          VisibilityLevel.Auditor,
        ]),
      ).toBe(VisibilityLevel.Auditor)
    })
  })

  describe("mergePolicies", () => {
    it("merges rules from multiple policies", () => {
      const p1 = makePolicy([{ field: "name", visibleAt: VisibilityLevel.Private }])
      const p2 = makePolicy([{ field: "price", visibleAt: VisibilityLevel.Partner }])

      const merged = evaluator.mergePolicies([p1, p2])

      expect(merged.rules).toHaveLength(2)
      expect(merged.rules.find((r) => r.field === "name")!.visibleAt).toBe(
        VisibilityLevel.Private,
      )
      expect(merged.rules.find((r) => r.field === "price")!.visibleAt).toBe(
        VisibilityLevel.Partner,
      )
    })

    it("later policies override earlier ones for the same field", () => {
      const p1 = makePolicy([{ field: "name", visibleAt: VisibilityLevel.Private }])
      const p2 = makePolicy([{ field: "name", visibleAt: VisibilityLevel.Public }])

      const merged = evaluator.mergePolicies([p1, p2])

      expect(merged.rules).toHaveLength(1)
      expect(merged.rules[0]!.field).toBe("name")
      expect(merged.rules[0]!.visibleAt).toBe(VisibilityLevel.Public)
    })

    it("uses the last policy's id and assetType", () => {
      const p1 = makePolicy([{ field: "name", visibleAt: VisibilityLevel.Private }])
      p1.id = "first"
      p1.assetType = "alpha"
      const p2 = makePolicy([{ field: "price", visibleAt: VisibilityLevel.Partner }])
      p2.id = "second"
      p2.assetType = "beta"

      const merged = evaluator.mergePolicies([p1, p2])

      expect(merged.id).toBe("second")
      expect(merged.assetType).toBe("beta")
    })

    it("returns empty policy when given empty array", () => {
      const merged = evaluator.mergePolicies([])

      expect(merged.id).toBe("merged")
      expect(merged.rules).toEqual([])
      expect(merged.assetType).toBeUndefined()
    })

    it("preserves rules from earlier policies not overridden by later ones", () => {
      const p1 = makePolicy([
        { field: "name", visibleAt: VisibilityLevel.Private },
        { field: "price", visibleAt: VisibilityLevel.Partner },
      ])
      const p2 = makePolicy([{ field: "price", visibleAt: VisibilityLevel.Public }])
      const p3 = makePolicy([{ field: "supplier", visibleAt: VisibilityLevel.Auditor }])

      const merged = evaluator.mergePolicies([p1, p2, p3])

      expect(merged.rules).toHaveLength(3)
      expect(merged.rules.find((r) => r.field === "name")!.visibleAt).toBe(
        VisibilityLevel.Private,
      )
      expect(merged.rules.find((r) => r.field === "price")!.visibleAt).toBe(
        VisibilityLevel.Public,
      )
      expect(merged.rules.find((r) => r.field === "supplier")!.visibleAt).toBe(
        VisibilityLevel.Auditor,
      )
    })
  })
})
