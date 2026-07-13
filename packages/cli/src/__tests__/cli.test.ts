import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProgram } from "../commands/index.js";

/**
 * These are real end-to-end tests: they drive the actual commander program,
 * which invokes the real @sigil/sdk (real Ed25519 crypto and SQLite graph
 * store) and performs real .sigilrc file I/O. No stubs or mocks — stdout is
 * captured and each test runs in an isolated temporary working directory.
 */

/** Run a CLI command, returning whatever it wrote to stdout. */
async function run(...args: string[]): Promise<string> {
  const original = process.stdout.write.bind(process.stdout);
  let buffer = "";
  process.stdout.write = (chunk: unknown): boolean => {
    buffer += String(chunk);
    return true;
  };

  try {
    await createProgram().parseAsync(args, { from: "user" });
  } finally {
    process.stdout.write = original;
  }

  return buffer;
}

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe("sigil CLI", () => {
  let cwd: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    cwd = await mkdtemp(join(tmpdir(), "sigil-cli-"));
    process.chdir(cwd);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(cwd, { recursive: true, force: true });
  });

  describe("init & backend config", () => {
    it("writes a .sigilrc file and echoes the config", async () => {
      const out = await run("init", "--backend", "local");

      expect(out).toContain("backend: local");
      const rc = await readFile(join(cwd, ".sigilrc"), "utf-8");
      expect(rc).toContain("backend: local");
    });

    it("reports the configured backend via `backend status`", async () => {
      await run("init", "--backend", "local");

      const out = await run("backend", "status");
      expect(JSON.parse(out)).toEqual({ backend: "local" });
    });

    it("switches backend and persists it across commands", async () => {
      const useOut = await run("backend", "use", "midnight");
      expect(useOut).toContain("Switched backend to: midnight");

      const statusOut = await run("backend", "status");
      expect(JSON.parse(statusOut)).toEqual({ backend: "midnight" });
    });

    it("defaults to the local backend when no .sigilrc exists", async () => {
      const out = await run("backend", "status");
      expect(JSON.parse(out)).toEqual({ backend: "local" });
    });
  });

  describe("asset", () => {
    it("creates an asset with a real ULID id via the SDK", async () => {
      const out = await run("asset", "create", "product", "--owner", "did:sigil:alice");
      const asset = JSON.parse(out) as {
        id: string;
        type: string;
        owner: string;
        visibility: number;
      };

      expect(asset.type).toBe("product");
      expect(asset.owner).toBe("did:sigil:alice");
      expect(asset.id).toMatch(ULID_RE);
      expect(asset.visibility).toBe(0);
    });

    it("defaults the owner DID when --owner is omitted", async () => {
      const out = await run("asset", "create", "widget");
      const asset = JSON.parse(out) as { owner: string };
      expect(asset.owner).toBe("did:sigil:cli");
    });
  });

  describe("claim", () => {
    it("makes a signed claim at the requested visibility", async () => {
      const out = await run(
        "claim",
        "make",
        "asset-x",
        "certifiedBy",
        "did:sigil:auditor",
        "--visibility",
        "2",
      );
      const claim = JSON.parse(out) as {
        id: string;
        subject: string;
        predicate: string;
        object: string;
        visibility: number;
      };

      expect(claim.id).toMatch(ULID_RE);
      expect(claim.subject).toBe("asset-x");
      expect(claim.predicate).toBe("certifiedBy");
      expect(claim.object).toBe("did:sigil:auditor");
      expect(claim.visibility).toBe(2);
    });
  });

  describe("event", () => {
    it("lists events for an asset (empty for an unknown asset)", async () => {
      // The CLI uses a fresh in-memory store per invocation (no cross-command
      // persistence yet), so an event chain is empty until events are recorded
      // in the same process. `event list` exercises the real query path.
      const out = await run("event", "list", "asset-x");
      expect(JSON.parse(out)).toEqual([]);
    });
  });

  describe("verify", () => {
    it("reports an invalid chain for an unknown asset", async () => {
      const out = await run("verify", "did:sigil:missing");
      const result = JSON.parse(out) as {
        valid: boolean;
        errors: { code: string }[];
      };

      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe("ASSET_NOT_FOUND");
    });
  });
});
