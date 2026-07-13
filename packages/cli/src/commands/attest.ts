import { Command } from "commander";
import { Sigil } from "@sigil/sdk";
import { loadConfig } from "../config.js";

export function attestCommand() {
  const command = new Command("attest");

  command
    .description("Attest a claim")
    .argument("<claimId>", "Claim ID")
    .action(async (claimId: string) => {
      const config = await loadConfig();
      const sigil = new Sigil({ backend: config.backend as "local" | "midnight" | "mock" });

      const attestation = await sigil.attest(claimId);
      process.stdout.write(JSON.stringify(attestation, null, 2) + "\n");
    });

  return command;
}
