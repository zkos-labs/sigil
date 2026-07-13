import { Command } from "commander";
import { Sigil } from "@sigil/sdk";
import { loadConfig } from "../config.js";

export function graphCommand() {
  const command = new Command("graph").description("Provenance graph operations");

  command
    .command("traverse")
    .description("Output provenance chain as JSON")
    .argument("<assetId>", "Asset ID")
    .action(async (assetId: string) => {
      const config = await loadConfig();
      const sigil = new Sigil({ backend: config.backend as "local" | "midnight" | "mock" });

      const chain = await sigil.graph.traverse(assetId);
      process.stdout.write(JSON.stringify(chain, null, 2) + "\n");
    });

  command
    .command("export")
    .description("Export provenance graph")
    .argument("<assetId>", "Asset ID")
    .option("--format <fmt>", "Output format: dot or json", "dot")
    .action(async (assetId: string, options: { format: string }) => {
      const config = await loadConfig();
      const sigil = new Sigil({ backend: config.backend as "local" | "midnight" | "mock" });

      const format = options.format as "dot" | "json";
      const output = await sigil.graph.export(assetId, format);
      process.stdout.write(output + "\n");
    });

  return command;
}
