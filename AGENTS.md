# AGENTS.md

## Project: Sigil

Sigil is a confidential provenance infrastructure written in TypeScript, designed as a backend-agnostic provenance layer with Midnight Network as the first confidential execution backend.

## Monorepo Structure

```
sigil/
├── packages/
│   ├── core/              @sigil/core      Zero-dependency types and interfaces
│   ├── crypto/            @sigil/crypto     Ed25519, SHA-256, DIDs, Merkle trees
│   ├── graph/             @sigil/graph      SQLite-backed graph store
│   ├── backend-local/     @sigil/backend-local   Local backend adapter
│   ├── backend-midnight/  @sigil/backend-midnight  Midnight Network adapter
│   ├── compact/           Midnight Compact contracts
│   ├── policy/            @sigil/policy     Policy engine and selective disclosure
│   ├── sdk/               @sigil/sdk        High-level developer API
│   └── cli/               @sigil/cli        Command-line interface
├── docs/                  Documentation, ADRs, RFCs
├── examples/              Example applications
└── paper/                 IEEE academic paper
```

## Conventions

- Package manager: pnpm with workspaces
- Language: TypeScript 5.6+, strict mode
- Testing: Vitest
- Formatting: Prettier
- Linting: ESLint with typescript-eslint strict
- Commits: Conventional Commits
- Versioning: Changesets
- Node: >= 20
- Module system: NodeNext (ESM)
- Imports: verbatimModuleSyntax enabled (use `import type` for type-only imports)

## Building

```bash
pnpm install          # Install all dependencies
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm typecheck        # Type-check all packages
pnpm lint             # Lint all packages
```

## Package Dependency Order

Build order must respect this dependency graph:

```
@sigil/core
  ├── @sigil/crypto
  ├── @sigil/graph
  └── @sigil/policy
        ├── @sigil/backend-local
        └── @sigil/backend-midnight
              └── @sigil/sdk
                    └── @sigil/cli
```

## Key Design Decisions

1. TypeScript for MVP core engine with stable interfaces for future Rust replacement
2. pnpm workspaces for monorepo management
3. Interface-based plugin design (Backend, GraphStore, CryptoProvider, PolicyEngine)
4. Event sourcing: append-only, no deletes
5. Graph-native provenance model over relational
6. ULIDs for identifiers (time-sortable, URL-safe)
7. Ed25519 as primary signature algorithm
8. SQLite via better-sqlite3 for local graph store
