import { describe, it, expect } from "vitest"
import { DIDGenerator } from "../did.js"

describe("DIDGenerator", () => {
  const generator = new DIDGenerator()

  const publicKey = new Uint8Array(32).fill(0xab)

  it("should generate a DID in the correct format", async () => {
    const did = await generator.generateDID(publicKey)
    expect(did).toMatch(/^did:sigil:[0-9a-f]{64}$/)
  })

  it("should produce the same DID for the same public key", async () => {
    const did1 = await generator.generateDID(publicKey)
    const did2 = await generator.generateDID(publicKey)
    expect(did1).toBe(did2)
  })

  it("should produce different DIDs for different public keys", async () => {
    const key1 = new Uint8Array(32).fill(0x01)
    const key2 = new Uint8Array(32).fill(0x02)
    const did1 = await generator.generateDID(key1)
    const did2 = await generator.generateDID(key2)
    expect(did1).not.toBe(did2)
  })

  it("should parse a valid DID", () => {
    const did = "did:sigil:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
    const parsed = generator.parseDID(did)
    expect(parsed.method).toBe("sigil")
    expect(parsed.hash).toHaveLength(64)
  })

  it("should throw on invalid DID format", () => {
    expect(() => generator.parseDID("did:other:1234")).toThrow(
      "Invalid DID format",
    )
    expect(() => generator.parseDID("not-a-did")).toThrow(
      "Invalid DID format",
    )
    expect(() => generator.parseDID("did:sigil:short")).toThrow(
      "Invalid DID format",
    )
  })

  it("isValidDID should accept valid DIDs", () => {
    const hex64 = "a".repeat(64)
    expect(generator.isValidDID(`did:sigil:${hex64}`)).toBe(true)
  })

  it("isValidDID should reject invalid DIDs", () => {
    expect(generator.isValidDID("")).toBe(false)
    expect(generator.isValidDID("did:other:a".repeat(64))).toBe(false)
    expect(generator.isValidDID("did:sigil:abc")).toBe(false)
    expect(generator.isValidDID("did:sigil:GGGG".repeat(16))).toBe(false)
  })

  it("generated DID should be valid and parseable", async () => {
    const did = await generator.generateDID(publicKey)
    expect(generator.isValidDID(did)).toBe(true)
    const parsed = generator.parseDID(did)
    expect(parsed.method).toBe("sigil")
    expect(parsed.hash).toHaveLength(64)
  })
})
