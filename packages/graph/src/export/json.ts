import type { ProvenanceChain } from "@sigil/core";

export function exportJsonLd(chain: ProvenanceChain): object {
  const { asset, events, claims, attestations } = chain;

  return {
    "@context": {
      "@vocab": "https://sigil.sh/ns/",
      "xsd": "http://www.w3.org/2001/XMLSchema#",
      "id": "@id",
      "type": "@type",
    },
    "@id": asset.id,
    "@type": asset.type,
    "owner": asset.owner,
    "metadata": asset.metadata,
    "visibility": asset.visibility,
    "createdAt": asset.createdAt,
    "events": events.map((e) => ({
      "@id": e.id,
      "@type": e.type,
      "issuer": e.issuer,
      "timestamp": e.timestamp,
      "proof": e.proof,
      "metadata": e.metadata,
    })),
    "claims": claims.map((c) => ({
      "@id": c.id,
      "subject": c.subject,
      "predicate": c.predicate,
      "object": c.object,
      "issuer": c.issuer,
      "signature": c.signature,
      "proof": c.proof,
      "visibility": c.visibility,
      "evidence": c.evidence,
    })),
    "attestations": attestations.map((a) => ({
      "@id": a.id,
      "claimId": a.claimId,
      "issuer": a.issuer,
      "proof": a.proof,
      "status": a.status,
      "expiresAt": a.expiresAt,
    })),
  };
}
