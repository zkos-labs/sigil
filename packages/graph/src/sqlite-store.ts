import Database from "better-sqlite3";
import type {
  Asset,
  AssetId,
  Attestation,
  AttestationId,
  Claim,
  ClaimId,
  Event,
  EventId,
  GraphStore,
  Proof,
  ProvenanceChain,
  Signature,
} from "@sigil/core";

const MIGRATION_001 = `
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  owner TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  visibility INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES assets(id),
  type TEXT NOT NULL,
  issuer TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  proof_type TEXT NOT NULL,
  proof_value TEXT NOT NULL,
  proof_evidence TEXT DEFAULT '[]',
  metadata TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  predicate TEXT NOT NULL,
  object TEXT NOT NULL,
  issuer TEXT NOT NULL,
  signature_algorithm TEXT NOT NULL,
  signature_value TEXT NOT NULL,
  signature_signer TEXT NOT NULL,
  signature_signed_at INTEGER NOT NULL,
  proof_type TEXT NOT NULL,
  proof_value TEXT NOT NULL,
  evidence TEXT DEFAULT '[]',
  visibility INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attestations (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL REFERENCES claims(id),
  issuer TEXT NOT NULL,
  proof_type TEXT NOT NULL,
  proof_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_events_asset ON events(asset_id);
CREATE INDEX IF NOT EXISTS idx_claims_subject ON claims(subject);
CREATE INDEX IF NOT EXISTS idx_attestations_claim ON attestations(claim_id);
`;

interface AssetRow {
  id: string;
  type: string;
  owner: string;
  metadata: string;
  visibility: number;
  created_at: number;
}

interface EventRow {
  id: string;
  asset_id: string;
  type: string;
  issuer: string;
  timestamp: number;
  proof_type: string;
  proof_value: string;
  proof_evidence: string;
  metadata: string;
}

interface ClaimRow {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  issuer: string;
  signature_algorithm: string;
  signature_value: string;
  signature_signer: string;
  signature_signed_at: number;
  proof_type: string;
  proof_value: string;
  evidence: string;
  visibility: number;
}

interface AttestationRow {
  id: string;
  claim_id: string;
  issuer: string;
  proof_type: string;
  proof_value: string;
  status: string;
  expires_at: number | null;
}

function migrate(db: Database.Database): void {
  db.exec(MIGRATION_001);
}

function deserializeProof(row: { proof_type: string; proof_value: string; proof_evidence?: string }): Proof {
  const proof: Proof = {
    type: row.proof_type as Proof["type"],
    value: row.proof_value,
  };
  if (row.proof_evidence) {
    proof.evidence = JSON.parse(row.proof_evidence) as Proof["evidence"];
  }
  return proof;
}

function deserializeSignature(row: ClaimRow): Signature {
  return {
    algorithm: row.signature_algorithm as Signature["algorithm"],
    signer: row.signature_signer,
    value: row.signature_value,
    signedAt: row.signature_signed_at,
  };
}

function rowToAsset(row: AssetRow): Asset {
  return {
    id: row.id,
    type: row.type,
    owner: row.owner,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    visibility: row.visibility,
    createdAt: row.created_at,
  };
}

function rowToEvent(row: EventRow): Event {
  return {
    id: row.id,
    assetId: row.asset_id,
    type: row.type,
    issuer: row.issuer,
    timestamp: row.timestamp,
    proof: deserializeProof({
      proof_type: row.proof_type,
      proof_value: row.proof_value,
      proof_evidence: row.proof_evidence,
    }),
    metadata: JSON.parse(row.metadata) as Record<string, unknown> | undefined,
  };
}

function rowToClaim(row: ClaimRow): Claim {
  return {
    id: row.id,
    subject: row.subject,
    predicate: row.predicate,
    object: row.object,
    issuer: row.issuer,
    signature: deserializeSignature(row),
    proof: deserializeProof(row),
    visibility: row.visibility,
    evidence: JSON.parse(row.evidence) as Claim["evidence"],
  };
}

function rowToAttestation(row: AttestationRow): Attestation {
  return {
    id: row.id,
    claimId: row.claim_id,
    issuer: row.issuer,
    proof: deserializeProof(row),
    status: row.status as Attestation["status"],
    expiresAt: row.expires_at ?? undefined,
  };
}

export class SqliteGraphStore implements GraphStore {
  private db: Database.Database;
  private stmtPutAsset: Database.Statement;
  private stmtGetAsset: Database.Statement;
  private stmtPutEvent: Database.Statement;
  private stmtGetEvents: Database.Statement;
  private stmtGetEvent: Database.Statement;
  private stmtPutClaim: Database.Statement;
  private stmtGetClaim: Database.Statement;
  private stmtGetClaimsBySubject: Database.Statement;
  private stmtPutAttestation: Database.Statement;
  private stmtGetAttestation: Database.Statement;
  private stmtGetAttestationsForClaim: Database.Statement;

  constructor(database?: Database.Database) {
    this.db = database ?? new Database(":memory:");
    this.db.pragma("journal_mode = WAL");

    migrate(this.db);

    this.stmtPutAsset = this.db.prepare(
      `INSERT INTO assets (id, type, owner, metadata, visibility, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );

    this.stmtGetAsset = this.db.prepare(
      `SELECT * FROM assets WHERE id = ?`,
    );

    this.stmtPutEvent = this.db.prepare(
      `INSERT INTO events (id, asset_id, type, issuer, timestamp, proof_type, proof_value, proof_evidence, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    this.stmtGetEvents = this.db.prepare(
      `SELECT * FROM events WHERE asset_id = ? ORDER BY timestamp ASC`,
    );

    this.stmtGetEvent = this.db.prepare(
      `SELECT * FROM events WHERE id = ?`,
    );

    this.stmtPutClaim = this.db.prepare(
      `INSERT INTO claims (id, subject, predicate, object, issuer,
         signature_algorithm, signature_value, signature_signer, signature_signed_at,
         proof_type, proof_value, evidence, visibility)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    this.stmtGetClaim = this.db.prepare(
      `SELECT * FROM claims WHERE id = ?`,
    );

    this.stmtGetClaimsBySubject = this.db.prepare(
      `SELECT * FROM claims WHERE subject = ?`,
    );

    this.stmtPutAttestation = this.db.prepare(
      `INSERT OR REPLACE INTO attestations (id, claim_id, issuer, proof_type, proof_value, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    this.stmtGetAttestation = this.db.prepare(
      `SELECT * FROM attestations WHERE id = ?`,
    );

    this.stmtGetAttestationsForClaim = this.db.prepare(
      `SELECT * FROM attestations WHERE claim_id = ?`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async putAsset(asset: Asset): Promise<void> {
    this.stmtPutAsset.run(
      asset.id,
      asset.type,
      asset.owner,
      JSON.stringify(asset.metadata),
      asset.visibility,
      asset.createdAt,
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getAsset(id: AssetId): Promise<Asset | null> {
    const row = this.stmtGetAsset.get(id) as AssetRow | undefined;
    if (!row) return null;
    return rowToAsset(row);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async putEvent(event: Event): Promise<void> {
    this.stmtPutEvent.run(
      event.id,
      event.assetId,
      event.type,
      event.issuer,
      event.timestamp,
      event.proof.type,
      event.proof.value,
      JSON.stringify(event.proof.evidence ?? []),
      JSON.stringify(event.metadata ?? {}),
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getEvents(assetId: AssetId): Promise<Event[]> {
    const rows = this.stmtGetEvents.all(assetId) as EventRow[];
    return rows.map(rowToEvent);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getEvent(id: EventId): Promise<Event | null> {
    const row = this.stmtGetEvent.get(id) as EventRow | undefined;
    if (!row) return null;
    return rowToEvent(row);
  }

  async traverse(assetId: AssetId): Promise<ProvenanceChain> {
    const asset = await this.getAsset(assetId);
    if (!asset) {
      return { asset: null as unknown as Asset, events: [], claims: [], attestations: [] };
    }

    const events = await this.getEvents(assetId);

    const subject = assetId;
    const claims = await this.getClaims(subject);

    const claimIds = claims.map((c) => c.id);
    const attestationRows: Attestation[] = [];
    for (const cid of claimIds) {
      const atts = await this.getAttestationsForClaim(cid);
      attestationRows.push(...atts);
    }

    return { asset, events, claims, attestations: attestationRows };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async putClaim(claim: Claim): Promise<void> {
    this.stmtPutClaim.run(
      claim.id,
      claim.subject,
      claim.predicate,
      claim.object,
      claim.issuer,
      claim.signature.algorithm,
      claim.signature.value,
      claim.signature.signer,
      claim.signature.signedAt,
      claim.proof.type,
      claim.proof.value,
      JSON.stringify(claim.evidence ?? []),
      claim.visibility,
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getClaim(id: ClaimId): Promise<Claim | null> {
    const row = this.stmtGetClaim.get(id) as ClaimRow | undefined;
    if (!row) return null;
    return rowToClaim(row);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getClaims(subject: string): Promise<Claim[]> {
    const rows = this.stmtGetClaimsBySubject.all(subject) as ClaimRow[];
    return rows.map(rowToClaim);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async putAttestation(attestation: Attestation): Promise<void> {
    this.stmtPutAttestation.run(
      attestation.id,
      attestation.claimId,
      attestation.issuer,
      attestation.proof.type,
      attestation.proof.value,
      attestation.status,
      attestation.expiresAt ?? null,
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getAttestation(id: AttestationId): Promise<Attestation | null> {
    const row = this.stmtGetAttestation.get(id) as AttestationRow | undefined;
    if (!row) return null;
    return rowToAttestation(row);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getAttestationsForClaim(claimId: ClaimId): Promise<Attestation[]> {
    const rows = this.stmtGetAttestationsForClaim.all(claimId) as AttestationRow[];
    return rows.map(rowToAttestation);
  }
}
