import { describe, it, expect } from "vitest"
import { Ed25519Provider } from "../ed25519.js"

describe("Ed25519Provider", () => {
  const provider = new Ed25519Provider()

  it("should generate a valid key pair", async () => {
    const keys = await provider.generateKeyPair()
    expect(keys.publicKey).toBeInstanceOf(Uint8Array)
    expect(keys.privateKey).toBeInstanceOf(Uint8Array)
    expect(keys.publicKey.length).toBe(32)
    expect(keys.privateKey.length).toBe(32)
  })

  it("should sign and verify data round-trip", async () => {
    const keys = await provider.generateKeyPair()
    const data = new TextEncoder().encode("hello world")

    const signature = await provider.sign(data, keys.privateKey)
    expect(signature.algorithm).toBe("ed25519")
    expect(signature.value).toBeTruthy()
    expect(signature.signer).toMatch(/^did:sigil:/)
    expect(signature.signedAt).toBeGreaterThan(0)

    const valid = await provider.verify(signature, data, keys.publicKey)
    expect(valid).toBe(true)
  })

  it("should fail verification with wrong key", async () => {
    const alice = await provider.generateKeyPair()
    const bob = await provider.generateKeyPair()
    const data = new TextEncoder().encode("secret message")

    const signature = await provider.sign(data, alice.privateKey)
    const valid = await provider.verify(signature, data, bob.publicKey)
    expect(valid).toBe(false)
  })

  it("should fail verification on tampered data", async () => {
    const keys = await provider.generateKeyPair()
    const data = new TextEncoder().encode("original data")
    const tampered = new TextEncoder().encode("tampered data")

    const signature = await provider.sign(data, keys.privateKey)
    const valid = await provider.verify(signature, tampered, keys.publicKey)
    expect(valid).toBe(false)
  })

  it("should return false for wrong signature algorithm", async () => {
    const keys = await provider.generateKeyPair()
    const data = new TextEncoder().encode("test")

    const result = await provider.verify(
      { algorithm: "secp256k1", signer: "did:sigil:0000", value: "00", signedAt: 0 },
      data,
      keys.publicKey,
    )
    expect(result).toBe(false)
  })
})
