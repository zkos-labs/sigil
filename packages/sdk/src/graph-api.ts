import type { AssetId, GraphStore, ProvenanceChain } from "@sigil/core";
import { exportDot } from "@sigil/graph";
import { exportJsonLd } from "@sigil/graph";

export class GraphAPI {
  #graph: GraphStore;

  constructor(graph: GraphStore) {
    this.#graph = graph;
  }

  async traverse(assetId: AssetId): Promise<ProvenanceChain> {
    return this.#graph.traverse(assetId);
  }

  async export(assetId: AssetId, format: "dot" | "json"): Promise<string> {
    const chain = await this.#graph.traverse(assetId);

    switch (format) {
      case "dot":
        return exportDot(chain);
      case "json":
        return JSON.stringify(exportJsonLd(chain), null, 2);
      default:
        throw new Error(`Unsupported export format: ${String(format)}`);
    }
  }
}
