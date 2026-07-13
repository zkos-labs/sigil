import { signAsync, verifyAsync, getPublicKeyAsync } from "@noble/ed25519"
import { sha256 } from "@noble/hashes/sha2"
import { randomBytes } from "node:crypto"
import type { CryptoProvider, DID, Hash, Signature } from "@sigil/core"

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex")
}

export class Ed25519Provider implements CryptoProvider {
  async sign(data: Uint8Array, privateKey: Uint8Array): Promise<Signature> {
    const sigBytes = await signAsync(data, privateKey)
    const publicKey = await getPublicKeyAsync(privateKey)
    const signer = await this.generateDID(publicKey)
    return {
      algorithm: "ed25519",
      signer,
      value: toHex(sigBytes),
      signedAt: Date.now(),
    }
  }

  async verify(
    signature: Signature,
    data: Uint8Array,
    publicKey: Uint8Array,
  ): Promise<boolean> {
    if (signature.algorithm !== "ed25519") return false
    const sigBytes = Buffer.from(signature.value, "hex")
    return verifyAsync(sigBytes, data, publicKey)
  }

  hash(data: Uint8Array): Promise<Hash> {
    return Promise.resolve(toHex(sha256(data)))
  }

  async generateKeyPair(): Promise<{
    publicKey: Uint8Array
    privateKey: Uint8Array
  }> {
    const privateKey = randomBytes(32)
    const publicKey = await getPublicKeyAsync(privateKey)
    return { publicKey, privateKey }
  }

  generateDID(publicKey: Uint8Array): Promise<DID> {
    const hash = sha256(publicKey)
    return Promise.resolve(`did:sigil:${toHex(hash)}`)
  }
}
