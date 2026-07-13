import { readFile } from "node:fs/promises";
import YAML from "yaml";

const CONFIG_PATH = ".sigilrc";

export async function loadConfig(): Promise<{ backend: string }> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    const parsed = YAML.parse(raw) as { backend?: unknown } | null | undefined;
    const backend =
      typeof parsed?.backend === "string" ? parsed.backend : "local";
    return { backend };
  } catch {
    return { backend: "local" };
  }
}
