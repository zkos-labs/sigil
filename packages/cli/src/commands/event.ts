import { Command } from "commander";
import { Sigil } from "@sigil/sdk";
import { loadConfig } from "../config.js";

export function eventCommand() {
  const command = new Command("event").description("Event management");

  command
    .command("record")
    .description("Record an event on an asset")
    .argument("<assetId>", "Asset ID")
    .argument("<type>", "Event type")
    .option("--metadata <json>", "JSON metadata for the event")
    .action(async (assetId: string, type: string, options: { metadata?: string }) => {
      const config = await loadConfig();
      const sigil = new Sigil({ backend: config.backend as "local" | "midnight" | "mock" });

      const metadata = options.metadata
        ? (JSON.parse(options.metadata) as Record<string, unknown>)
        : undefined;

      const event = await sigil.event.record(assetId, type, metadata);
      process.stdout.write(JSON.stringify(event, null, 2) + "\n");
    });

  command
    .command("list")
    .description("List all events for an asset")
    .argument("<assetId>", "Asset ID")
    .action(async (assetId: string) => {
      const config = await loadConfig();
      const sigil = new Sigil({ backend: config.backend as "local" | "midnight" | "mock" });

      const events = await sigil.event.list(assetId);
      process.stdout.write(JSON.stringify(events, null, 2) + "\n");
    });

  return command;
}
