import type { Policy, PolicyRule } from "@sigil/core"

export class PolicyParser {
  parse(json: string): Policy {
    const raw = JSON.parse(json) as Record<string, unknown>

    if (typeof raw.id !== "string" || raw.id.length === 0) {
      throw new Error("Policy must have a non-empty string 'id'")
    }
    if (!Array.isArray(raw.rules)) {
      throw new Error("Policy must have a 'rules' array")
    }

    const rules: PolicyRule[] = raw.rules.map((r: unknown, i: number) => {
      if (typeof r !== "object" || r === null) {
        throw new Error(`Policy rule at index ${i} must be an object`)
      }
      const rule = r as Record<string, unknown>
      if (typeof rule.field !== "string" || rule.field.length === 0) {
        throw new Error(`Policy rule at index ${i} must have a non-empty 'field' string`)
      }
      if (typeof rule.visibleAt !== "number" || rule.visibleAt < 0 || rule.visibleAt > 4) {
        throw new Error(
          `Policy rule at index ${i} must have 'visibleAt' between 0 and 4`,
        )
      }
      return { field: rule.field, visibleAt: rule.visibleAt }
    })

    const policy: Policy = { id: raw.id, rules }
    if (typeof raw.assetType === "string") {
      policy.assetType = raw.assetType
    }
    return policy
  }

  validate(policy: Policy): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (policy.rules.length === 0) {
      errors.push("Policy must have at least one rule")
    }

    for (let i = 0; i < policy.rules.length; i++) {
      const rule = policy.rules[i]
      if (!rule) continue

      if (typeof rule.field !== "string" || rule.field.length === 0) {
        errors.push(`Rule at index ${i}: 'field' must be a non-empty string`)
      }
      if (typeof rule.visibleAt !== "number" || rule.visibleAt < 0 || rule.visibleAt > 4) {
        errors.push(`Rule at index ${i}: 'visibleAt' must be between 0 and 4`)
      }
    }

    return { valid: errors.length === 0, errors }
  }
}
