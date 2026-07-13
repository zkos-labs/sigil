import type { Asset, DID, Policy, PolicyRule } from "@sigil/core"
import { VisibilityLevel } from "@sigil/core"

export class FieldEvaluator {
  evaluateField(
    _asset: Asset,
    _viewer: DID,
    policy: Policy,
    field: string,
    viewerRoles: VisibilityLevel[],
  ): boolean {
    if (field === "id" || field === "type") return true

    const rule = policy.rules.find((r) => r.field === field)
    if (!rule) return false

    const level = this.resolveDisclosureLevel(_asset, _viewer, viewerRoles)
    return rule.visibleAt <= level
  }

  resolveDisclosureLevel(
    _asset: Asset,
    _viewer: DID,
    viewerRoles: VisibilityLevel[],
  ): VisibilityLevel {
    if (viewerRoles.length === 0) return VisibilityLevel.Private
    return Math.max(...viewerRoles)
  }

  mergePolicies(policies: Policy[]): Policy {
    const ruleMap = new Map<string, PolicyRule>()

    for (const p of policies) {
      for (const r of p.rules) {
        ruleMap.set(r.field, r)
      }
    }

    const last = policies.length > 0 ? policies[policies.length - 1]! : null

    return {
      id: last?.id ?? "merged",
      assetType: last?.assetType,
      rules: [...ruleMap.values()],
    }
  }
}
