import { describe, it, expect } from "vitest"
import { MerkleTree } from "../merkle.js"

function leaf(index: number): Uint8Array {
  return new TextEncoder().encode(`leaf-${index}`)
}

describe("MerkleTree", () => {
  it("should throw if tree not built", () => {
    const tree = new MerkleTree()
    expect(() => tree.root()).toThrow("Merkle tree has not been built")
  })

  it("should throw on zero items", () => {
    const tree = new MerkleTree()
    expect(() => {
      tree.build([])
    }).toThrow("zero items")
  })

  it("should return a consistent root for same data", () => {
    const tree1 = new MerkleTree()
    const tree2 = new MerkleTree()
    tree1.build([leaf(0), leaf(1), leaf(2), leaf(3)])
    tree2.build([leaf(0), leaf(1), leaf(2), leaf(3)])
    expect(tree1.root()).toBe(tree2.root())
  })

  it("should generate and verify a proof", () => {
    const tree = new MerkleTree()
    tree.build([leaf(0), leaf(1), leaf(2), leaf(3)])

    for (let i = 0; i < 4; i++) {
      const proof = tree.generateProof(i)
      expect(proof.leaf).toMatch(/^[0-9a-f]{64}$/)
      expect(proof.root).toMatch(/^[0-9a-f]{64}$/)
      expect(proof.index).toBe(i)
      expect(proof.path.length).toBeGreaterThan(0)
      expect(tree.verifyProof(proof)).toBe(true)
    }
  })

  it("should reject an invalid proof (wrong leaf)", () => {
    const tree = new MerkleTree()
    tree.build([leaf(0), leaf(1), leaf(2), leaf(3)])

    const proof = tree.generateProof(0)
    proof.leaf = Buffer.from(new Uint8Array(32).fill(0xff)).toString("hex")
    expect(tree.verifyProof(proof)).toBe(false)
  })

  it("should reject an invalid proof (wrong path)", () => {
    const tree = new MerkleTree()
    tree.build([leaf(0), leaf(1), leaf(2), leaf(3)])

    const proof = tree.generateProof(0)
    proof.path[0] = "0".repeat(64)
    expect(tree.verifyProof(proof)).toBe(false)
  })

  it("should reject an invalid proof (wrong root)", () => {
    const tree = new MerkleTree()
    tree.build([leaf(0), leaf(1), leaf(2), leaf(3)])

    const proof = tree.generateProof(0)
    proof.root = "f".repeat(64)
    expect(tree.verifyProof(proof)).toBe(false)
  })

  it("should reject an invalid proof (wrong index)", () => {
    const tree = new MerkleTree()
    tree.build([leaf(0), leaf(1), leaf(2), leaf(3)])

    const proof = tree.generateProof(0)
    proof.index = 1
    expect(tree.verifyProof(proof)).toBe(false)
  })

  it("should handle odd number of leaves via padding", () => {
    const tree = new MerkleTree()
    tree.build([leaf(0), leaf(1), leaf(2)]) // 3 leaves, pads to 4

    expect(() => tree.root()).not.toThrow()
    expect(tree.root()).toMatch(/^[0-9a-f]{64}$/)

    // Proofs for all original leaves should verify
    for (let i = 0; i < 3; i++) {
      const proof = tree.generateProof(i)
      expect(tree.verifyProof(proof)).toBe(true)
    }
  })

  it("should handle single leaf", () => {
    const tree = new MerkleTree()
    tree.build([leaf(0)])

    expect(tree.root()).toMatch(/^[0-9a-f]{64}$/)
    const proof = tree.generateProof(0)
    expect(proof.path).toHaveLength(1)
    expect(tree.verifyProof(proof)).toBe(true)
  })

  it("should throw on out-of-bounds index", () => {
    const tree = new MerkleTree()
    tree.build([leaf(0), leaf(1)])

    expect(() => tree.generateProof(-1)).toThrow("out of bounds")
    expect(() => tree.generateProof(2)).toThrow("out of bounds")
  })

  it("different leaf order should produce different roots", () => {
    const tree1 = new MerkleTree()
    const tree2 = new MerkleTree()
    tree1.build([leaf(0), leaf(1)])
    tree2.build([leaf(1), leaf(0)])
    expect(tree1.root()).not.toBe(tree2.root())
  })
})
