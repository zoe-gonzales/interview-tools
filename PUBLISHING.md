# Publishing `@interview-tools/nextjs-generators`

This guide covers how to version, publish, and validate new releases of the generators using `nx release` and a local [Verdaccio](https://verdaccio.org/) registry.

---

## Prerequisites

Assumes you have just cloned this repo. Install dependencies first:

```bash
pnpm install
```

Minimum required versions:

| Technology | Minimum version |
|---|---|
| Node.js | **22.x** (`nvm use` picks up `.nvmrc`) |
| pnpm | **9.x** |
| Nx | **24.x** |

---

## 1. Run `nx release`

`nx release` handles versioning, changelog generation, git tagging, and publishing in one command. It is scoped to the `nextjs-generators` project (see `release.projects` in [`nx.json`](./nx.json)).

### Dry run first (recommended)

```bash
pnpm nx release --dry-run
```

This shows you exactly what would happen — version bump, changelog diff, and publish target — without touching git or the registry.

### Run the release

```bash
pnpm nx release
```

You will be prompted to choose a version bump (`patch`, `minor`, `major`, or a custom version). After confirming:

1. `nx release` bumps the version in `packages/nextjs-generators/package.json`
2. Generates / updates `packages/nextjs-generators/CHANGELOG.md`
3. Commits the changes and creates a git tag (e.g. `nextjs-generators@0.0.2`)
4. Builds the package (`preVersionCommand`: `pnpm nx build nextjs-generators`)
5. Publishes to the registry configured in `publishConfig` (default: `http://localhost:4873/`)

> [!IMPORTANT]
> By default `publishConfig.registry` in `packages/nextjs-generators/package.json` points to the **local Verdaccio registry** (`http://localhost:4873`). Make sure the local registry is running before publishing (see [step 2](#2-start-the-local-registry)).

---

## 2. Start the local registry

The local registry is a Verdaccio instance managed by the `local-registry` Nx target defined in the root `package.json`.

Open a **separate terminal** and run:

```bash
pnpm nx local-registry @interview-tools/source
```

Verdaccio starts on `http://localhost:4873`. Leave this terminal running throughout your publish and consume workflow.

> [!NOTE]
> Package storage lives at `tmp/local-registry/storage/` (gitignored). It persists between runs until you delete it manually.

---

## 3. Expected git diff before release

Before committing, run `git diff` (or `git diff --staged` after `nx release` commits). You should see changes in exactly these files:

```
packages/nextjs-generators/package.json   ← version bump (e.g. "0.0.1" → "0.0.2")
packages/nextjs-generators/CHANGELOG.md   ← new entry for the release
```

A new git tag is also created:

```bash
git tag --list 'nextjs-generators@*'
# nextjs-generators@0.0.2
```

If you see changes in other files, review them before proceeding.

---

## 4. Validate the publish was successful

### Check the local registry UI

Open `http://localhost:4873` in your browser and confirm `@interview-tools/nextjs-generators` appears with the new version.

### Query the registry from the CLI

```bash
pnpm view @interview-tools/nextjs-generators --registry http://localhost:4873
```

Look for `"version": "0.0.2"` (or whichever version you just published) in the output.

---

## 5. Consume the published version from the local registry

In your **consumer Nx workspace** (the interview project), point pnpm at the local registry for this package and install it:

### Option A — via `.npmrc` in the consumer workspace

Create or update `.npmrc` in the root of the consumer workspace:

```ini
@interview-tools:registry=http://localhost:4873/
```

Then install:

```bash
pnpm add -D -w @interview-tools/nextjs-generators
```

### Option B — via the `--registry` flag

```bash
pnpm add -D -w @interview-tools/nextjs-generators --registry http://localhost:4873
```

### Verify the installed version

```bash
pnpm list @interview-tools/nextjs-generators
# @interview-tools/nextjs-generators 0.0.2
```

The generators are now ready to run. See [packages/nextjs-generators/README.md](./packages/nextjs-generators/README.md) for usage.

