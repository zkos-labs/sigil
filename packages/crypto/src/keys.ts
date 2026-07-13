import { getPublicKeyAsync } from "@noble/ed25519"
import { randomBytes } from "node:crypto"

export class KeyManager {
  async generateKeyPair(): Promise<{
    publicKey: Uint8Array
    privateKey: Uint8Array
  }> {
    const privateKey = randomBytes(32)
    const publicKey = await getPublicKeyAsync(privateKey)
    return { publicKey, privateKey }
  }

  serializePublicKey(key: Uint8Array): string {
    return Buffer.from(key).toString("hex")
  }

  deserializePublicKey(hex: string): Uint8Array {
    return new Uint8Array(Buffer.from(hex, "hex"))
  }

  serializePrivateKey(key: Uint8Array): string {
    return Buffer.from(key).toString("hex")
  }

  deserializePrivateKey(hex: string): Uint8Array {
    return new Uint8Array(Buffer.from(hex, "hex"))
  }
}
