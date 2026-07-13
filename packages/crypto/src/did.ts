import { sha256 } from "@noble/hashes/sha2"

const DID_REGEX = /^did:sigil:([0-9a-f]{64})$/

export class DIDGenerator {
  generateDID(publicKey: Uint8Array): Promise<string> {
    const hash = sha256(publicKey)
    return Promise.resolve(`did:sigil:${Buffer.from(hash).toString("hex")}`)
  }

  parseDID(did: string): { method: string; hash: string } {
    const match = DID_REGEX.exec(did)
    if (!match) {
      throw new Error(`Invalid DID format: ${did}`)
    }
    return { method: "sigil", hash: match[1]! }
  }

  isValidDID(did: string): boolean {
    return DID_REGEX.test(did)
  }
}
