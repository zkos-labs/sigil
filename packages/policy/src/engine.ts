import type {
  Asset,
  DID,
  DisclosureResult,
  Policy,
  PolicyEngine,
} from "@sigil/core"
import { ProofType, VisibilityLevel } from "@sigil/core"

export class DefaultPolicyEngine implements PolicyEngine {
  evaluate(
    asset: Asset,
    _viewer: DID,
    policy: Policy,
    viewerRoles: VisibilityLevel[],
  ): Promise<DisclosureResult> {
    const highestRole = this.getHighestRole(viewerRoles)
    const fields: Record<string, unknown> = {
      id: asset.id,
      type: asset.type,
    }

    for (const field of Object.keys(asset.metadata)) {
      const rule = policy.rules.find((r) => r.field === field)
      if (rule && rule.visibleAt <= highestRole) {
        fields[field] = asset.metadata[field]
      } else {
        fields[field] = null
      }
    }

    return Promise.resolve({
      assetId: asset.id,
      fields,
      proof: {
        type: ProofType.None,
        value: "disclosure-result",
      },
    })
  }

  getVisibleFields(
    asset: Asset,
    _viewer: DID,
    viewerRoles: VisibilityLevel[],
  ): Promise<string[]> {
    const highestRole = this.getHighestRole(viewerRoles)
    if (highestRole < asset.visibility) {
      return Promise.resolve([])
    }
    return Promise.resolve(Object.keys(asset.metadata))
  }

  private getHighestRole(roles: VisibilityLevel[]): number {
    if (roles.length === 0) return -1
    return Math.max(...roles)
  }
}
