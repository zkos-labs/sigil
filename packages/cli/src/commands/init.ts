import { writeFile } from "node:fs/promises";
import { Command } from "commander";
import YAML from "yaml";

export function initCommand() {
  const command = new Command("init");

  command
    .description("Create a .sigilrc config file in the current directory")
    .option("--backend <name>", "Backend to use", "local");

  command.action(async (options: { backend: string }) => {
    const config = { backend: options.backend };
    const yaml = YAML.stringify(config);
    await writeFile(".sigilrc", yaml, "utf-8");
    process.stdout.write(yaml);
  });

  return command;
}
