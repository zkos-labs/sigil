# Contributing to Sigil

Thanks for your interest in Sigil — a confidential provenance layer anchored by Midnight Network. This guide covers how to build, test, and contribute. See [AGENTS.md](../AGENTS.md) for the full developer/agent conventions and the package build graph.

## Prerequisites

- Node.js ≥ 20
- pnpm (see the pinned version in root `package.json`)

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

## Repository layout

A pnpm monorepo (`packages/*`), build order: `core → crypto/graph/policy → backend-local/backend-midnight → sdk → cli`.

| Package | Purpose |
|---|---|
| `@sigil/core` | zero-dependency types & interfaces (the stable contract) |
| `@sigil/crypto` | Ed25519, SHA-256, `did:sigil`, Merkle |
| `@sigil/graph` | SQLite graph store, DOT/JSON-LD export |
| `@sigil/policy` | policy engine & selective disclosure |
| `@sigil/backend-local` | local development backend |
| `@sigil/backend-midnight` | Midnight trust-anchor adapter *(planned)* |
| `@sigil/sdk` | high-level developer API |
| `@sigil/cli` | command-line interface |

## Conventions

- **Language:** TypeScript 5.6+, strict mode, NodeNext ESM, `verbatimModuleSyntax`.
- **Testing:** Vitest; add tests mirroring the shipping packages, keep coverage healthy.
- **Formatting/lint:** Prettier + strict ESLint (`pnpm format`, `pnpm lint`).
- **Commits:** Conventional Commits.
- **Releases:** Changesets — add a changeset for user-facing changes.
- **Stability:** treat `@sigil/core` interfaces as a public contract; a future Rust core must honor them. Discuss breaking changes via an RFC.

## Workflow

1. Branch from `main`.
2. Make focused changes with tests.
3. Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` (CI runs these on Node 20 & 22).
4. Add a changeset; open a PR with a Conventional Commit title.

## RFCs

Substantial or cross-cutting changes go through an RFC in [`docs/RFC/`](RFC/). Copy an existing RFC's structure (Summary / Motivation / Design / Alternatives / Open questions) and open a PR for discussion.

## License

By contributing you agree your contributions are licensed under Apache 2.0 (see [LICENSE](../LICENSE)).
