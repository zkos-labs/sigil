import { sha256 } from "@noble/hashes/sha2"

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex")
}

function concatAndHash(left: Uint8Array, right: Uint8Array): Uint8Array {
  const combined = new Uint8Array(left.length + right.length)
  combined.set(left)
  combined.set(right, left.length)
  return sha256(combined)
}

export interface MerkleProof {
  root: string
  path: string[]
  leaf: string
  index: number
}

export class MerkleTree {
  private leaves: Uint8Array[] = []
  private layers: Uint8Array[][] = []

  build(items: Uint8Array[]): void {
    if (items.length === 0) {
      throw new Error("Cannot build Merkle tree with zero items")
    }

    const padded = [...items]
    if (padded.length % 2 === 1) {
      padded.push(padded[padded.length - 1]!)
    }
    this.leaves = padded

    this.layers = [padded.map((item) => sha256(item))]

    let currentLayer = 0
    while (this.layers[currentLayer]!.length > 1) {
      const layer = this.layers[currentLayer]!
      const nextLayer: Uint8Array[] = []
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i]!
        const right = i + 1 < layer.length ? layer[i + 1]! : layer[i]!
        nextLayer.push(concatAndHash(left, right))
      }
      this.layers.push(nextLayer)
      currentLayer++
    }
  }

  root(): string {
    if (this.layers.length === 0) {
      throw new Error("Merkle tree has not been built")
    }
    const topLayer = this.layers[this.layers.length - 1]!
    return toHex(topLayer[0]!)
  }

  generateProof(index: number): MerkleProof {
    if (this.layers.length === 0) {
      throw new Error("Merkle tree has not been built")
    }
    if (index < 0 || index >= this.leaves.length) {
      throw new Error(`Index ${index} out of bounds (0-${this.leaves.length - 1})`)
    }

    const leafHash = sha256(this.leaves[index]!)
    const path: string[] = []
    let currentIndex = index

    for (let layer = 0; layer < this.layers.length - 1; layer++) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1
      const sibling = this.layers[layer]![siblingIndex]!
      path.push(toHex(sibling))
      currentIndex = Math.floor(currentIndex / 2)
    }

    return {
      root: this.root(),
      path,
      leaf: toHex(leafHash),
      index,
    }
  }

  verifyProof(proof: MerkleProof): boolean {
    let currentHash = Buffer.from(proof.leaf, "hex")
    let currentIndex = proof.index

    for (const siblingHex of proof.path) {
      const siblingHash = Buffer.from(siblingHex, "hex")
      if (currentIndex % 2 === 0) {
        currentHash = Buffer.from(concatAndHash(currentHash, siblingHash))
      } else {
        currentHash = Buffer.from(concatAndHash(siblingHash, currentHash))
      }
      currentIndex = Math.floor(currentIndex / 2)
    }

    return toHex(currentHash) === proof.root
  }
}
