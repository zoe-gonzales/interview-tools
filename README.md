# interview-tools

Easy-to-use Nx generators to scaffold a simple, working application stack for **software developer interviews**. Works for frontend-only and full stack apps. Spend your pre-interview time brushing up on your skills instead of fighting with broken boilerplate.

## What's in this repo

| Package | Description |
|---|---|
| [`@interview-tools/nextjs-generators`](./packages/nextjs-generators/README.md) | Nx plugin with `frontend` and `fullstack` generators |

### Generated stacks

- **Frontend** — Next.js + React, Vitest unit tests, dev server on `:4200`
- **Fullstack** — Next.js frontend + Express REST API + SQLite via Prisma ORM, with `/api/*` proxy routing between them

### Packaging & Registry Architecture

`@interview-tools/nextjs-generators` is currently configured to use a local [Verdaccio](https://verdaccio.org/) registry (`http://localhost:4873/`) as an initial development and isolation step. This allows verifying package boundaries and consumption workflows in an isolated sandbox.

> [!NOTE]
> Using a local Verdaccio registry is an initial architecture step; the package will ultimately be published to public npm under a public scope. See [PUBLISHING.md](./PUBLISHING.md) for registry setup and publishing instructions.

---

## Prerequisites

This repo is itself an Nx workspace and is used to **publish generators into a consumer's Nx workspace**. Before using it, make sure the following minimum versions are installed:

| Technology | Minimum version | Notes |
|---|---|---|
| Node.js | **22.x** | `.nvmrc` pins `v22.21.0`; run `nvm use` to match |
| pnpm | **9.x** | Workspace uses `pnpm@9.15.9` |
| Nx | **24.x** | Declared in `package.json` as `nx@24.0.0` |

> [!NOTE]
> The generators are designed to be consumed from a **separate Nx workspace** in your interview project. If you don't have one yet, [create a new Nx workspace](https://nx.dev/packages/nx/documents/create-nx-workspace) first.

---

## Documentation

- [Using the generators →](./packages/nextjs-generators/README.md) — running the `frontend` and `fullstack` generators, verifying the generated app
- [Publishing new versions →](./PUBLISHING.md) — versioning with `nx release`, local registry workflow, validation

---

## Contributing

After cloning this repo, install dependencies:

```bash
pnpm install
```

See [PUBLISHING.md](./PUBLISHING.md) for the full release workflow.
