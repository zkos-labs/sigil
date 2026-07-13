import type {
  Asset,
  AssetId,
  Backend,
  CreateAssetParams,
  DID,
} from "@sigil/core";
import { ProofType, VisibilityLevel } from "@sigil/core";
import { ulid } from "ulid";

export class AssetAPI {
  #backend: Backend;

  constructor(backend: Backend) {
    this.#backend = backend;
  }

  async create(params: CreateAssetParams): Promise<Asset> {
    const ownerDID: DID = params.owner;
    const asset: Asset = {
      id: ulid(),
      type: params.type,
      owner: ownerDID,
      metadata: params.metadata ?? {},
      visibility: params.visibility ?? VisibilityLevel.Private,
      createdAt: Date.now(),
    };

    await this.#backend.commit([{ type: "asset", data: asset }]);

    return asset;
  }

  async get(id: AssetId): Promise<Asset | null> {
    const results = await this.#backend.query({ assetId: id });
    const found = results.find((item) => item.type === "asset");
    return (found?.data as Asset | undefined) ?? null;
  }

  async update(id: AssetId, updates: Partial<Asset>): Promise<Asset> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Asset not found: ${id}`);
    }

    const updated: Asset = { ...existing, ...updates, id };

    const eventId = ulid();
    const event = {
      id: eventId,
      assetId: id,
      type: "updated",
      issuer: existing.owner,
      timestamp: Date.now(),
      proof: { type: ProofType.None, value: "" },
      metadata: { previous: existing, changes: updates },
    };

    await this.#backend.commit([
      { type: "asset", data: updated },
      { type: "event", data: event },
    ]);

    return updated;
  }
}
