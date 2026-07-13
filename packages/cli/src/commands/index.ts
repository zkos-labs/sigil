import { Command } from "commander";
import { initCommand } from "./init.js";
import { assetCommand } from "./asset.js";
import { eventCommand } from "./event.js";
import { claimCommand } from "./claim.js";
import { attestCommand } from "./attest.js";
import { verifyCommand } from "./verify.js";
import { discloseCommand } from "./disclose.js";
import { graphCommand } from "./graph.js";
import { backendCommand } from "./backend.js";

export function createProgram() {
  const program = new Command();
  program.name("sigil").description("Confidential provenance CLI").version("0.1.0");

  program.addCommand(initCommand());
  program.addCommand(assetCommand());
  program.addCommand(eventCommand());
  program.addCommand(claimCommand());
  program.addCommand(attestCommand());
  program.addCommand(verifyCommand());
  program.addCommand(discloseCommand());
  program.addCommand(graphCommand());
  program.addCommand(backendCommand());

  return program;
}
