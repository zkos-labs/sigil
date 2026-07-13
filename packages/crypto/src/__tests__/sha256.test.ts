import { describe, it, expect } from "vitest"
import { Sha256Hasher } from "../sha256.js"

describe("Sha256Hasher", () => {
  const hasher = new Sha256Hasher()

  it("should produce same hash for same input", async () => {
    const data = new TextEncoder().encode("test data")
    const h1 = await hasher.hash(data)
    const h2 = await hasher.hash(data)
    expect(h1).toBe(h2)
  })

  it("should produce different hashes for different inputs", async () => {
    const a = new TextEncoder().encode("alpha")
    const b = new TextEncoder().encode("beta")
    const ha = await hasher.hash(a)
    const hb = await hasher.hash(b)
    expect(ha).not.toBe(hb)
  })

  it("should produce a 64-character hex string", async () => {
    const data = new TextEncoder().encode("hello")
    const hash = await hasher.hash(data)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it("should match known SHA-256 test vector (empty string)", async () => {
    const data = new Uint8Array(0)
    const hash = await hasher.hash(data)
    expect(hash).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )
  })

  it("hashToBytes should return Uint8Array of 32 bytes", () => {
    const data = new TextEncoder().encode("test")
    const bytes = hasher.hashToBytes(data)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBe(32)
  })

  it("hash and hashToBytes should be consistent", async () => {
    const data = new TextEncoder().encode("consistent")
    const hex = await hasher.hash(data)
    const bytes = hasher.hashToBytes(data)
    expect(Buffer.from(bytes).toString("hex")).toBe(hex)
  })
})
