import { Command } from "commander";
import { Sigil } from "@sigil/sdk";
import { loadConfig } from "../config.js";

export function verifyCommand() {
  const command = new Command("verify");

  command
    .description("Verify provenance chain for an asset")
    .argument("<assetId>", "Asset ID")
    .action(async (assetId: string) => {
      const config = await loadConfig();
      const sigil = new Sigil({ backend: config.backend as "local" | "midnight" | "mock" });

      const result = await sigil.verify(assetId);
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    });

  return command;
}
