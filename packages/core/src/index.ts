export type AssetId = string;
export type EventId = string;
export type ClaimId = string;
export type AttestationId = string;
export type PolicyId = string;
export type DID = string;
export type Hash = string;
export type Timestamp = number;

export enum VisibilityLevel {
  Private = 0,
  Partner = 1,
  Auditor = 2,
  Regulator = 3,
  Public = 4,
}

export enum AttestationStatus {
  Active = "active",
  Revoked = "revoked",
  Expired = "expired",
}

export enum EvidenceType {
  ZkProof = "zk-proof",
  Pdf = "pdf",
  IpfsCid = "ipfs-cid",
  SensorData = "sensor-data",
  Signature = "signature",
  ExternalRef = "external-ref",
  Image = "image",
}

export enum ProofType {
  Ed25519 = "ed25519",
  Secp256k1 = "secp256k1",
  Did = "did",
  AztecZk = "aztec-zk",
  MidnightZk = "midnight-zk",
  None = "none",
}

export enum EventType {
  Created = "created",
  Transferred = "transferred",
  Certified = "certified",
  Inspected = "inspected",
  Revoked = "revoked",
  Updated = "updated",
  Custom = "custom",
}

export interface Asset {
  id: AssetId;
  type: string;
  owner: DID;
  metadata: Record<string, unknown>;
  visibility: VisibilityLevel;
  createdAt: Timestamp;
}

export interface Event {
  id: EventId;
  assetId: AssetId;
  type: string;
  issuer: DID;
  timestamp: Timestamp;
  proof: Proof;
  metadata?: Record<string, unknown>;
}

export interface Claim {
  id: ClaimId;
  subject: string;
  predicate: string;
  object: string;
  issuer: DID;
  signature: Signature;
  proof: Proof;
  visibility: VisibilityLevel;
  evidence?: Evidence[];
}

export interface Attestation {
  id: AttestationId;
  claimId: ClaimId;
  issuer: DID;
  proof: Proof;
  status: AttestationStatus;
  expiresAt?: Timestamp;
}

export interface Evidence {
  type: EvidenceType;
  value: string;
  metadata?: Record<string, unknown>;
}

export interface Proof {
  type: ProofType;
  value: string;
  evidence?: Evidence[];
}

export interface Signature {
  algorithm: "ed25519" | "secp256k1";
  signer: DID;
  value: string;
  signedAt: Timestamp;
}

export interface Policy {
  id: PolicyId;
  assetType?: string;
  rules: PolicyRule[];
}

export interface PolicyRule {
  field: string;
  visibleAt: VisibilityLevel;
}

export interface DisclosureRequest {
  assetId: AssetId;
  recipient: DID;
  level: VisibilityLevel;
  fields: string[];
  proof?: Proof;
}

export interface DisclosureReceipt {
  id: string;
  assetId: AssetId;
  recipient: DID;
  level: VisibilityLevel;
  disclosedFields: string[];
  proof: Proof;
  issuedAt: Timestamp;
}

export interface DisclosureResult {
  assetId: AssetId;
  fields: Record<string, unknown>;
  proof: Proof;
}

export interface VerificationResult {
  assetId: AssetId;
  valid: boolean;
  chain: ProvenanceChain;
  errors: VerificationError[];
}

export interface VerificationError {
  code: string;
  message: string;
  detail?: unknown;
}

export interface ProvenanceChain {
  asset: Asset;
  events: Event[];
  claims: Claim[];
  attestations: Attestation[];
}

export interface Receipt {
  id: string;
  type: "asset" | "event" | "claim" | "attestation" | "disclosure";
  hash: Hash;
  proof: Proof;
  timestamp: Timestamp;
}

export interface QueryFilter {
  assetId?: AssetId;
  issuer?: DID;
  type?: string;
  since?: Timestamp;
  until?: Timestamp;
  visibility?: VisibilityLevel;
  limit?: number;
  offset?: number;
}

export interface ProvenanceItem {
  type: "asset" | "event" | "claim" | "attestation";
  data: Asset | Event | Claim | Attestation;
}

export interface CreateAssetParams {
  type: string;
  owner: DID;
  metadata?: Record<string, unknown>;
  visibility?: VisibilityLevel;
}

export interface RecordEventParams {
  assetId: AssetId;
  type: string;
  metadata?: Record<string, unknown>;
}

export interface MakeClaimParams {
  subject: string;
  predicate: string;
  object: string;
  evidence?: Evidence[];
  visibility?: VisibilityLevel;
}

export interface DiscloseParams {
  assetId: AssetId;
  recipient: DID;
  level: VisibilityLevel;
  fields: string[];
}

export type BackendName = "local" | "aztec" | "midnight" | "mock";

export interface SigilConfig {
  backend: BackendName;
  crypto?: CryptoProvider;
  graph?: GraphStore;
  policy?: PolicyEngine;
}

export interface AztecConfig {
  network: "sandbox" | "testnet" | "mainnet";
  pxeUrl?: string;
  l1RpcUrl?: string;
  accountAddress?: string;
}

// On hold — Midnight is a deferred alternate confidential backend. See RFC 0003.
export interface MidnightConfig {
  network: "testnet" | "mainnet";
  walletPath?: string;
  indexerUrl?: string;
  proofServerUrl?: string;
}

export interface Backend {
  commit(items: ProvenanceItem[]): Promise<Receipt[]>;
  query(filter: QueryFilter): Promise<ProvenanceItem[]>;
  verify(receipt: Receipt): Promise<VerificationResult>;
  disclose(disclosure: DisclosureRequest): Promise<DisclosureReceipt>;
  revoke(attestationId: AttestationId): Promise<Receipt>;
}

export interface GraphStore {
  putAsset(asset: Asset): Promise<void>;
  getAsset(id: AssetId): Promise<Asset | null>;
  putEvent(event: Event): Promise<void>;
  getEvents(assetId: AssetId): Promise<Event[]>;
  getEvent(id: EventId): Promise<Event | null>;
  traverse(assetId: AssetId): Promise<ProvenanceChain>;
  putClaim(claim: Claim): Promise<void>;
  getClaim(id: ClaimId): Promise<Claim | null>;
  getClaims(subject: string): Promise<Claim[]>;
  putAttestation(attestation: Attestation): Promise<void>;
  getAttestation(id: AttestationId): Promise<Attestation | null>;
  getAttestationsForClaim(claimId: ClaimId): Promise<Attestation[]>;
}

export interface CryptoProvider {
  sign(data: Uint8Array, privateKey: Uint8Array): Promise<Signature>;
  verify(signature: Signature, data: Uint8Array, publicKey: Uint8Array): Promise<boolean>;
  hash(data: Uint8Array): Promise<Hash>;
  generateKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }>;
  generateDID(publicKey: Uint8Array): Promise<DID>;
}

export interface PolicyEngine {
  evaluate(
    asset: Asset,
    viewer: DID,
    policy: Policy,
    viewerRoles: VisibilityLevel[],
  ): Promise<DisclosureResult>;
  getVisibleFields(
    asset: Asset,
    viewer: DID,
    viewerRoles: VisibilityLevel[],
  ): Promise<string[]>;
}

export class SigilError extends Error {
  constructor(
    message: string,
    public code: string,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "SigilError";
  }
}

export class AssetNotFoundError extends SigilError {
  constructor(id: AssetId) {
    super(`Asset not found: ${id}`, "ASSET_NOT_FOUND", { id });
    this.name = "AssetNotFoundError";
  }
}

export class InvalidProofError extends SigilError {
  constructor(detail?: unknown) {
    super("Proof verification failed", "INVALID_PROOF", detail);
    this.name = "InvalidProofError";
  }
}

export class UnauthorizedDisclosureError extends SigilError {
  constructor(assetId: AssetId, recipient: DID) {
    super(
      `Disclosure not authorized for recipient ${recipient} on asset ${assetId}`,
      "UNAUTHORIZED_DISCLOSURE",
      { assetId, recipient },
    );
    this.name = "UnauthorizedDisclosureError";
  }
}

export class BackendError extends SigilError {
  constructor(message: string, detail?: unknown) {
    super(message, "BACKEND_ERROR", detail);
    this.name = "BackendError";
  }
}
