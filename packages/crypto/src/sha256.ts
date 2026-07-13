import { sha256 as nobleSha256 } from "@noble/hashes/sha2"

export class Sha256Hasher {
  hash(data: Uint8Array): Promise<string> {
    return Promise.resolve(Buffer.from(nobleSha256(data)).toString("hex"))
  }

  hashToBytes(data: Uint8Array): Uint8Array {
    return nobleSha256(data)
  }
}
