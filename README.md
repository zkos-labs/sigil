# Sigil

**Confidential Provenance Infrastructure**

[![CI](https://github.com/zkos-labs/sigil/actions/workflows/ci.yml/badge.svg)](https://github.com/zkos-labs/sigil/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

Sigil is a multichain zero-knowledge provenance layer anchored by Midnight Network. Applications running on Ethereum, Solana, Cardano, or other ecosystems can generate verifiable provenance through Sigil, while Midnight serves as the confidential trust anchor for commitments, selective disclosure, and zero-knowledge verification.

It is an open-source, backend-agnostic engine: developers integrate once and gain Midnight-level confidential provenance regardless of where their application runs — with privacy preserved through programmable, policy-driven selective disclosure.

## Packages

| Package | Description |
|---------|-------------|
| `@sigil/core` | Zero-dependency types and interfaces |
| `@sigil/crypto` | Ed25519 signatures, SHA-256, DIDs, Merkle trees |
| `@sigil/graph` | SQLite-backed provenance graph store |
| `@sigil/policy` | Policy engine and selective disclosure |
| `@sigil/backend-local` | Local backend adapter for development |
| `@sigil/backend-midnight` | Midnight Network backend adapter |
| `@sigil/sdk` | High-level developer API |
| `@sigil/cli` | Command-line interface |

## Quick Start

```bash
pnpm install
pnpm build
pnpm test
```

## Documentation

- [PRD](docs/PRD.md) — Product vision and requirements
- [Architecture](docs/ARCHITECTURE.md) — System architecture
- [Graph Model](docs/GRAPH_MODEL.md) — Provenance graph specification
- [Cryptography](docs/CRYPTOGRAPHY.md) — Cryptographic model
- [Policy](docs/POLICY.md) — Policy engine and disclosure
- [Backends](docs/BACKENDS.md) — Trust anchor and execution adapters
- [Plugins](docs/PLUGINS.md) — Plugin system
- [SDK](docs/SDK.md) — Developer API reference
- [API](docs/API.md) — REST, GraphQL, gRPC specifications
- [Roadmap](docs/ROADMAP.md) — Milestones and releases
- [Contributing](docs/CONTRIBUTING.md) — Contributor guide
- [RFCs](docs/RFC/) — Design proposals

> Sigil is at an early (v0.1) stage. The docs describe the target architecture; see [PRD §12.9 — Current Implementation Status](docs/PRD.md#129-current-implementation-status) for what is built today.

## License

Apache 2.0 — see [LICENSE](LICENSE)
