import Database from "better-sqlite3";
import { Ed25519Provider } from "@sigil/crypto";
import { SqliteGraphStore } from "@sigil/graph";
import { DefaultPolicyEngine } from "@sigil/policy";
import { LocalBackend } from "@sigil/backend-local";
import {
  AttestationStatus,
  ProofType,
  type AssetId,
  type Attestation,
  type AttestationId,
  type ClaimId,
  type CryptoProvider,
  type DID,
  type DiscloseParams,
  type DisclosureReceipt,
  type GraphStore,
  type PolicyEngine,
  type Receipt,
  type SigilConfig,
  type VerificationResult,
} from "@sigil/core";
import { ulid } from "ulid";
import { AssetAPI } from "./asset-api.js";
import { EventAPI } from "./event-api.js";
import { ClaimAPI } from "./claim-api.js";
import { GraphAPI } from "./graph-api.js";

export class Sigil {
  readonly asset: AssetAPI;
  readonly event: EventAPI;
  readonly claim: ClaimAPI;
  readonly graph: GraphAPI;

  #backend: LocalBackend;
  #crypto: CryptoProvider;
  #graph: GraphStore;
  #did!: DID;

  constructor(config: SigilConfig) {
    const db = new Database(":memory:");
    const graphStore = new SqliteGraphStore(db);
    const cryptoProvider = config.crypto ?? new Ed25519Provider();
    const policyEngine: PolicyEngine = config.policy ?? new DefaultPolicyEngine();
    const backend = new LocalBackend({
      graph: graphStore,
      crypto: cryptoProvider,
      policy: policyEngine,
    });

    this.#backend = backend;
    this.#crypto = cryptoProvider;
    this.#graph = graphStore;

    this.asset = new AssetAPI(backend);
    this.event = new EventAPI(backend);
    this.claim = new ClaimAPI(backend, graphStore);
    this.graph = new GraphAPI(graphStore);
  }

  async attest(claimId: ClaimId): Promise<Attestation> {
    await this.#ensureIdentity();

    const claim = await this.#graph.getClaim(claimId);
    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    const attestation: Attestation = {
      id: ulid(),
      claimId,
      issuer: this.#did,
      proof: { type: ProofType.None, value: "" },
      status: AttestationStatus.Active,
    };

    const proofValue = await this.#crypto.hash(
      new TextEncoder().encode(JSON.stringify(attestation)),
    );
    attestation.proof = { type: ProofType.None, value: proofValue };

    const signature = await this.#crypto.sign(
      new TextEncoder().encode(JSON.stringify(attestation)),
      this.#keypair.privateKey,
    );

    await this.#graph.putAttestation(attestation);

    return { ...attestation, proof: { type: ProofType.Ed25519, value: signature.value } };
  }

  async verify(assetId: AssetId): Promise<VerificationResult> {
    const asset = await this.#graph.getAsset(assetId);

    if (!asset) {
      const chain = await this.#graph.traverse(assetId);
      return {
        assetId,
        valid: false,
        chain,
        errors: [{ code: "ASSET_NOT_FOUND", message: `Asset not found: ${assetId}` }],
      };
    }

    const chain = await this.#graph.traverse(assetId);
    const errors: VerificationResult["errors"] = [];

    for (const evt of chain.events) {
      if (evt.issuer !== asset.owner) {
        errors.push({
          code: "EVENT_ISSUER_MISMATCH",
          message: `Event ${evt.id} issuer ${evt.issuer} does not match asset owner ${chain.asset.owner}`,
          detail: { eventId: evt.id },
        });
      }
    }

    for (const claim of chain.claims) {
      if (claim.subject !== assetId) {
        errors.push({
          code: "CLAIM_SUBJECT_MISMATCH",
          message: `Claim ${claim.id} subject ${claim.subject} does not match asset ${assetId}`,
          detail: { claimId: claim.id },
        });
      }
    }

    for (const att of chain.attestations) {
      const attClaim = chain.claims.find((c) => c.id === att.claimId);
      if (!attClaim) {
        errors.push({
          code: "ATTESTATION_ORPHAN",
          message: `Attestation ${att.id} references claim ${att.claimId} but claim is not in the chain`,
          detail: { attestationId: att.id },
        });
      }
    }

    return {
      assetId,
      valid: errors.length === 0,
      chain,
      errors,
    };
  }

  async disclose(params: DiscloseParams): Promise<DisclosureReceipt> {
    return this.#backend.disclose({
      assetId: params.assetId,
      recipient: params.recipient,
      level: params.level,
      fields: params.fields,
    });
  }

  async revoke(attestationId: AttestationId): Promise<Receipt> {
    return this.#backend.revoke(attestationId);
  }

  #keypair!: { publicKey: Uint8Array; privateKey: Uint8Array };
  #identity?: Promise<void>;

  /**
   * Lazily and idempotently generate this instance's keypair and DID.
   * Memoized so concurrent callers share a single initialization, and
   * awaited by any operation (e.g. {@link attest}) that needs identity —
   * avoiding the race where the constructor's async setup had not resolved.
   */
  #ensureIdentity(): Promise<void> {
    this.#identity ??= (async () => {
      this.#keypair = await this.#crypto.generateKeyPair();
      this.#did = await this.#crypto.generateDID(this.#keypair.publicKey);
    })();
    return this.#identity;
  }

  /** Resolve this instance's DID, initializing identity on first use. */
  async did(): Promise<DID> {
    await this.#ensureIdentity();
    return this.#did;
  }
}
