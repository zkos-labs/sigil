import { describe, it, expect } from "vitest"
import { KeyManager } from "../keys.js"

describe("KeyManager", () => {
  const manager = new KeyManager()

  it("should generate valid key pair", async () => {
    const keys = await manager.generateKeyPair()
    expect(keys.publicKey).toBeInstanceOf(Uint8Array)
    expect(keys.privateKey).toBeInstanceOf(Uint8Array)
    expect(keys.publicKey.length).toBe(32)
    expect(keys.privateKey.length).toBe(32)
  })

  it("should generate unique key pairs", async () => {
    const keys1 = await manager.generateKeyPair()
    const keys2 = await manager.generateKeyPair()
    const pub1Hex = manager.serializePublicKey(keys1.publicKey)
    const pub2Hex = manager.serializePublicKey(keys2.publicKey)
    expect(pub1Hex).not.toBe(pub2Hex)
  })

  it("should serialize and deserialize public key round-trip", () => {
    const key = new Uint8Array(32).fill(0x42)
    const hex = manager.serializePublicKey(key)
    expect(hex).toHaveLength(64)
    const restored = manager.deserializePublicKey(hex)
    expect(restored).toEqual(key)
  })

  it("should serialize and deserialize private key round-trip", () => {
    const key = new Uint8Array(32).fill(0x99)
    const hex = manager.serializePrivateKey(key)
    expect(hex).toHaveLength(64)
    const restored = manager.deserializePrivateKey(hex)
    expect(restored).toEqual(key)
  })

  it("serialized keys should be lowercase hex", () => {
    const key = new Uint8Array([0xab, 0xcd, 0xef])
    const hex = manager.serializePublicKey(key)
    expect(hex).toBe("abcdef")
  })
})
