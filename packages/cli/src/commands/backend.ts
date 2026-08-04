import { Command } from "commander";
import { loadConfig } from "../config.js";
import { writeFile } from "node:fs/promises";
import YAML from "yaml";

const CONFIG_PATH = ".sigilrc";

export function backendCommand() {
  const command = new Command("backend").description("Backend management");

  command
    .command("status")
    .description("Print current backend configuration")
    .action(async () => {
      const config = await loadConfig();
      process.stdout.write(JSON.stringify(config, null, 2) + "\n");
    });

  command
    .command("use")
    .description("Switch the active backend")
    .argument("<backend>", "Backend name (local, aztec, or midnight)")
    .action(async (backend: string) => {
      if (backend !== "local" && backend !== "aztec" && backend !== "midnight") {
        process.stderr.write(
          `Unknown backend: ${backend}. Use 'local', 'aztec', or 'midnight'.\n`,
        );
        process.exit(1);
      }

      const config = { backend };
      const yaml = YAML.stringify(config);
      await writeFile(CONFIG_PATH, yaml, "utf-8");
      process.stdout.write(`Switched backend to: ${backend}\n`);
    });

  return command;
}
