import { describe, it, expect } from "vitest"
import { PolicyParser } from "../parser.js"
import { VisibilityLevel } from "@sigil/core"

const validPolicyJSON = JSON.stringify({
  id: "policy-001",
  assetType: "widget",
  rules: [
    { field: "name", visibleAt: 1 },
    { field: "price", visibleAt: 2 },
    { field: "supplier", visibleAt: 3 },
  ],
})

describe("PolicyParser", () => {
  const parser = new PolicyParser()

  describe("parse", () => {
    it("parses a valid policy JSON string", () => {
      const policy = parser.parse(validPolicyJSON)

      expect(policy.id).toBe("policy-001")
      expect(policy.assetType).toBe("widget")
      expect(policy.rules).toHaveLength(3)
      expect(policy.rules[0]).toEqual({
        field: "name",
        visibleAt: VisibilityLevel.Partner,
      })
      expect(policy.rules[1]).toEqual({
        field: "price",
        visibleAt: VisibilityLevel.Auditor,
      })
      expect(policy.rules[2]).toEqual({
        field: "supplier",
        visibleAt: VisibilityLevel.Regulator,
      })
    })

    it("parses a policy with string id and numeric visibleAt", () => {
      const json = JSON.stringify({
        id: "p1",
        rules: [{ field: "x", visibleAt: 0 }],
      })
      const policy = parser.parse(json)

      expect(policy.id).toBe("p1")
      expect(policy.assetType).toBeUndefined()
      expect(policy.rules[0]!.visibleAt).toBe(VisibilityLevel.Private)
    })

    it("throws on missing id", () => {
      const json = JSON.stringify({ rules: [] })
      expect(() => parser.parse(json)).toThrow("must have a non-empty string 'id'")
    })

    it("throws on empty id", () => {
      const json = JSON.stringify({ id: "", rules: [] })
      expect(() => parser.parse(json)).toThrow("must have a non-empty string 'id'")
    })

    it("throws when rules is not an array", () => {
      const json = JSON.stringify({ id: "p1", rules: "not-an-array" })
      expect(() => parser.parse(json)).toThrow("must have a 'rules' array")
    })

    it("throws on rule with empty field string", () => {
      const json = JSON.stringify({
        id: "p1",
        rules: [{ field: "", visibleAt: 1 }],
      })
      expect(() => parser.parse(json)).toThrow("non-empty 'field' string")
    })

    it("throws on rule with missing field", () => {
      const json = JSON.stringify({
        id: "p1",
        rules: [{ visibleAt: 1 }],
      })
      expect(() => parser.parse(json)).toThrow("non-empty 'field' string")
    })

    it("throws on rule with visibleAt < 0", () => {
      const json = JSON.stringify({
        id: "p1",
        rules: [{ field: "x", visibleAt: -1 }],
      })
      expect(() => parser.parse(json)).toThrow("between 0 and 4")
    })

    it("throws on rule with visibleAt > 4", () => {
      const json = JSON.stringify({
        id: "p1",
        rules: [{ field: "x", visibleAt: 5 }],
      })
      expect(() => parser.parse(json)).toThrow("between 0 and 4")
    })

    it("throws on non-object rule", () => {
      const json = JSON.stringify({
        id: "p1",
        rules: ["not-an-object"],
      })
      expect(() => parser.parse(json)).toThrow("must be an object")
    })
  })

  describe("validate", () => {
    it("returns valid true for a valid policy", () => {
      const policy = parser.parse(validPolicyJSON)
      const result = parser.validate(policy)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it("returns valid false and errors for empty rules array", () => {
      const result = parser.validate({ id: "p1", rules: [] })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain("Policy must have at least one rule")
    })

    it("returns valid false and errors for missing field", () => {
      const result = parser.validate({
        id: "p1",
        rules: [{ field: "", visibleAt: 1 }],
      })

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("'field'"))).toBe(true)
    })

    it("returns valid false and errors for invalid visibleAt", () => {
      const policy = {
        id: "p1",
        rules: [{ field: "name", visibleAt: 99 as unknown as VisibilityLevel }],
      }
      const result = parser.validate(policy)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("'visibleAt'"))).toBe(true)
    })

    it("collects multiple validation errors", () => {
      const policy = {
        id: "p1",
        rules: [
          { field: "", visibleAt: 1 },
          { field: "name", visibleAt: 99 as unknown as VisibilityLevel },
        ],
      }
      const result = parser.validate(policy)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })
})
