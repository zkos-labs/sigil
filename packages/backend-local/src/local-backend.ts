import type {
  Asset,
  Attestation,
  AttestationId,
  Backend,
  Claim,
  CryptoProvider,
  DisclosureReceipt,
  DisclosureRequest,
  Event,
  GraphStore,
  PolicyEngine,
  ProvenanceChain,
  ProvenanceItem,
  QueryFilter,
  Receipt,
  VerificationResult,
} from "@sigil/core";
import {
  AssetNotFoundError,
  AttestationStatus,
  BackendError,
  ProofType,
} from "@sigil/core";

export class LocalBackend implements Backend {
  private graph: GraphStore;
  private crypto: CryptoProvider;
  private policy?: PolicyEngine;

  constructor(options: {
    graph: GraphStore;
    crypto: CryptoProvider;
    policy?: PolicyEngine;
  }) {
    this.graph = options.graph;
    this.crypto = options.crypto;
    this.policy = options.policy;
  }

  async commit(items: ProvenanceItem[]): Promise<Receipt[]> {
    const receipts: Receipt[] = [];

    for (const item of items) {
      const dataBytes = new TextEncoder().encode(JSON.stringify(item.data));
      const hash = await this.crypto.hash(dataBytes);

      switch (item.type) {
        case "asset":
          await this.graph.putAsset(item.data as Asset);
          break;
        case "event":
          await this.graph.putEvent(item.data as Event);
          break;
        case "claim":
          await this.graph.putClaim(item.data as Claim);
          break;
        case "attestation":
          await this.graph.putAttestation(item.data as Attestation);
          break;
      }

      receipts.push({
        id: (item.data as { id: string }).id,
        type: item.type,
        hash,
        proof: { type: ProofType.None, value: hash },
        timestamp: Date.now(),
      });
    }

    return receipts;
  }

  async query(filter: QueryFilter): Promise<ProvenanceItem[]> {
    const results: ProvenanceItem[] = [];

    if (filter.assetId) {
      const asset = await this.graph.getAsset(filter.assetId);
      if (asset) {
        results.push({ type: "asset" as const, data: asset });

        const events = await this.graph.getEvents(filter.assetId);
        for (const event of events) {
          results.push({ type: "event" as const, data: event });
        }

        const claims = await this.graph.getClaims(filter.assetId);
        for (const claim of claims) {
          results.push({ type: "claim" as const, data: claim });
          const attestations = await this.graph.getAttestationsForClaim(
            claim.id,
          );
          for (const att of attestations) {
            results.push({ type: "attestation" as const, data: att });
          }
        }
      }
    }

    if (filter.issuer) {
      return results.filter((item) => {
        const data = item.data as { issuer?: string; owner?: string };
        return (
          data.issuer === filter.issuer || data.owner === filter.issuer
        );
      });
    }

    return results;
  }

  async verify(receipt: Receipt): Promise<VerificationResult> {
    const emptyChain: ProvenanceChain = {
      asset: null as unknown as Asset,
      events: [],
      claims: [],
      attestations: [],
    };

    // Verify the receipt against committed state: the referenced entity must
    // still exist in the graph store. A receipt for an unknown id (or for an
    // entity type that was never committed) fails verification.
    let exists: boolean;
    switch (receipt.type) {
      case "asset":
        exists = (await this.graph.getAsset(receipt.id)) !== null;
        break;
      case "event":
        exists = (await this.graph.getEvent(receipt.id)) !== null;
        break;
      case "claim":
        exists = (await this.graph.getClaim(receipt.id)) !== null;
        break;
      case "attestation":
        exists = (await this.graph.getAttestation(receipt.id)) !== null;
        break;
      default:
        exists = false;
    }

    if (!exists) {
      return {
        assetId: receipt.id,
        valid: false,
        chain: emptyChain,
        errors: [
          {
            code: "RECEIPT_NOT_FOUND",
            message: `No committed ${receipt.type} found for receipt ${receipt.id}`,
            detail: { receiptId: receipt.id, type: receipt.type },
          },
        ],
      };
    }

    // For assets, return the full provenance chain; other entity types are
    // verified in isolation.
    const chain =
      receipt.type === "asset"
        ? await this.graph.traverse(receipt.id)
        : emptyChain;

    return { assetId: receipt.id, valid: true, chain, errors: [] };
  }

  async disclose(
    disclosure: DisclosureRequest,
  ): Promise<DisclosureReceipt> {
    const asset = await this.graph.getAsset(disclosure.assetId);
    if (!asset) {
      throw new AssetNotFoundError(disclosure.assetId);
    }

    let disclosedFields: string[];

    if (this.policy) {
      const visibleFields = await this.policy.getVisibleFields(
        asset,
        disclosure.recipient,
        [disclosure.level],
      );
      disclosedFields = disclosure.fields.filter((f) =>
        visibleFields.includes(f),
      );
    } else {
      disclosedFields = disclosure.fields.filter(
        (f) =>
          f === "id" || f === "type" || Object.keys(asset.metadata).includes(f),
      );
    }

    const id = `disclosure-${asset.id}-${Date.now().toString()}`;
    const hash = await this.crypto.hash(
      new TextEncoder().encode(
        JSON.stringify({ disclosedFields, assetId: asset.id }),
      ),
    );

    return {
      id,
      assetId: disclosure.assetId,
      recipient: disclosure.recipient,
      level: disclosure.level,
      disclosedFields,
      proof: { type: ProofType.None, value: hash },
      issuedAt: Date.now(),
    };
  }

  async revoke(attestationId: AttestationId): Promise<Receipt> {
    const attestation = await this.graph.getAttestation(attestationId);
    if (!attestation) {
      throw new BackendError(`Attestation not found: ${attestationId}`);
    }

    attestation.status = AttestationStatus.Revoked;
    await this.graph.putAttestation(attestation);

    const hash = await this.crypto.hash(
      new TextEncoder().encode(JSON.stringify(attestation)),
    );

    return {
      id: attestationId,
      type: "attestation",
      hash,
      proof: { type: ProofType.None, value: hash },
      timestamp: Date.now(),
    };
  }
}
