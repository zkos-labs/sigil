import { Command } from "commander";
import { Sigil } from "@sigil/sdk";
import type { BackendName } from "@sigil/core";
import { loadConfig } from "../config.js";

export function claimCommand() {
  const command = new Command("claim").description("Claim management");

  command
    .command("make")
    .description("Make a claim")
    .argument("<subject>", "Subject identifier")
    .argument("<predicate>", "Predicate")
    .argument("<object>", "Object value")
    .option("--visibility <level>", "Visibility level 0-4", "0")
    .action(
      async (
        subject: string,
        predicate: string,
        object: string,
        options: { visibility: string },
      ) => {
        const config = await loadConfig();
        const sigil = new Sigil({ backend: config.backend as BackendName });

        const visibility = parseInt(options.visibility, 10) as 0 | 1 | 2 | 3 | 4;
        const claim = await sigil.claim.make({
          subject,
          predicate,
          object,
          visibility,
        });
        process.stdout.write(JSON.stringify(claim, null, 2) + "\n");
      },
    );

  command
    .command("get")
    .description("Get a claim by ID")
    .argument("<id>", "Claim ID")
    .action(async (id: string) => {
      const config = await loadConfig();
      const sigil = new Sigil({ backend: config.backend as BackendName });

      const claim = await sigil.claim.get(id);
      if (!claim) {
        process.stderr.write(`Claim not found: ${id}\n`);
        process.exit(1);
      }
      process.stdout.write(JSON.stringify(claim, null, 2) + "\n");
    });

  return command;
}
