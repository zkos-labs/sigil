import { Command } from "commander";
import { Sigil } from "@sigil/sdk";
import type { BackendName } from "@sigil/core";
import { loadConfig } from "../config.js";

export function discloseCommand() {
  const command = new Command("disclose");

  command
    .description("Perform selective disclosure")
    .argument("<assetId>", "Asset ID")
    .argument("<recipientDID>", "Recipient DID")
    .option("--level <n>", "Disclosure level 0-4", "1")
    .option("--fields <names>", "Comma-separated field names to disclose")
    .action(
      async (
        assetId: string,
        recipientDID: string,
        options: { level: string; fields?: string },
      ) => {
        const config = await loadConfig();
        const sigil = new Sigil({ backend: config.backend as BackendName });

        const level = parseInt(options.level, 10) as 0 | 1 | 2 | 3 | 4;
        const fields = options.fields
          ? options.fields.split(",").map((f) => f.trim())
          : [];

        const receipt = await sigil.disclose({
          assetId,
          recipient: recipientDID,
          level,
          fields,
        });
        process.stdout.write(JSON.stringify(receipt, null, 2) + "\n");
      },
    );

  return command;
}
