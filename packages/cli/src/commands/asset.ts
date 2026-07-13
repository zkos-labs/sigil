import { Command } from "commander";
import { Sigil } from "@sigil/sdk";
import { loadConfig } from "../config.js";

export function assetCommand() {
  const command = new Command("asset").description("Asset management");

  command
    .command("create")
    .description("Create a new asset")
    .argument("<type>", "Asset type")
    .option("--owner <did>", "Owner DID")
    .action(async (type: string, options: { owner?: string }) => {
      const config = await loadConfig();
      const sigil = new Sigil({ backend: config.backend as "local" | "midnight" | "mock" });

      const owner = options.owner ?? "did:sigil:cli";
      const asset = await sigil.asset.create({ type, owner });
      process.stdout.write(JSON.stringify(asset, null, 2) + "\n");
    });

  command
    .command("get")
    .description("Get an asset by ID")
    .argument("<id>", "Asset ID")
    .action(async (id: string) => {
      const config = await loadConfig();
      const sigil = new Sigil({ backend: config.backend as "local" | "midnight" | "mock" });

      const asset = await sigil.asset.get(id);
      if (!asset) {
        process.stderr.write(`Asset not found: ${id}\n`);
        process.exit(1);
      }
      process.stdout.write(JSON.stringify(asset, null, 2) + "\n");
    });

  return command;
}
