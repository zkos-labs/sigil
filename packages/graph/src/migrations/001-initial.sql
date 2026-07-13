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
