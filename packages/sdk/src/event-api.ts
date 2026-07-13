import type {
  Asset,
  AssetId,
  Backend,
  Event,
} from "@sigil/core";
import { ProofType } from "@sigil/core";
import { ulid } from "ulid";

export class EventAPI {
  #backend: Backend;

  constructor(backend: Backend) {
    this.#backend = backend;
  }

  async record(
    assetId: AssetId,
    type: string,
    metadata?: Record<string, unknown>,
  ): Promise<Event> {
    // Attribute the event to the asset's owner. Events are part of the
    // owner's provenance chain, and verification checks issuer against the
    // asset owner; falling back to a system DID only if the asset is absent.
    const existing = await this.#backend.query({ assetId });
    const asset = existing.find((item) => item.type === "asset")?.data as
      | Asset
      | undefined;

    const event: Event = {
      id: ulid(),
      assetId,
      type,
      issuer: asset?.owner ?? "did:sigil:system",
      timestamp: Date.now(),
      proof: { type: ProofType.None, value: "" },
      metadata,
    };

    await this.#backend.commit([{ type: "event", data: event }]);

    return event;
  }

  async list(assetId: AssetId): Promise<Event[]> {
    const results = await this.#backend.query({ assetId });
    return results
      .filter((item) => item.type === "event")
      .map((item) => item.data as Event);
  }
}
