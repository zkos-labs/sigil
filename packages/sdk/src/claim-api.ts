import type {
  Backend,
  Claim,
  ClaimId,
  GraphStore,
  MakeClaimParams,
} from "@sigil/core";
import { ProofType, VisibilityLevel } from "@sigil/core";
import { ulid } from "ulid";

export class ClaimAPI {
  #backend: Backend;
  #graph: GraphStore;

  constructor(backend: Backend, graph: GraphStore) {
    this.#backend = backend;
    this.#graph = graph;
  }

  async make(params: MakeClaimParams): Promise<Claim> {
    const claim: Claim = {
      id: ulid(),
      subject: params.subject,
      predicate: params.predicate,
      object: params.object,
      issuer: "did:sigil:system",
      signature: {
        algorithm: "ed25519",
        signer: "did:sigil:system",
        value: "",
        signedAt: Date.now(),
      },
      proof: { type: ProofType.None, value: "" },
      visibility: params.visibility ?? VisibilityLevel.Private,
      evidence: params.evidence,
    };

    await this.#backend.commit([{ type: "claim", data: claim }]);

    return claim;
  }

  async get(id: ClaimId): Promise<Claim | null> {
    // Claims are looked up by id directly against the graph store; the
    // asset-centric backend query cannot resolve a claim from its id alone.
    return this.#graph.getClaim(id);
  }
}
