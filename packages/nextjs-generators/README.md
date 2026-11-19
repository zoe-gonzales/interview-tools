# @interview-tools/nextjs-generators

An Nx plugin that scaffolds a **Next.js application stack for software developer interviews**. Pick the generator that matches your interview brief and get a fully configured project in seconds.

| Generator | What it creates |
|---|---|
| `frontend` | Next.js + React app with Vitest unit tests |
| `fullstack` | Next.js frontend + Express REST API + SQLite via Prisma ORM |

---

## Prerequisites

Assumes you have just cloned this repo **and** have a separate Nx workspace to consume the generators in. If you don't have a consumer workspace yet, [create one with `create-nx-workspace`](https://nx.dev/packages/nx/documents/create-nx-workspace).

Minimum required versions:

| Technology | Minimum version | Notes |
|---|---|---|
| Node.js | **22.x** | `.nvmrc` pins `v22.21.0`; run `nvm use` |
| pnpm | **9.x** | Workspace uses `pnpm@9.15.9` |
| Nx | **24.x** | Required in both this repo and the consumer workspace |

---

## Installation — consume from local registry

> [!IMPORTANT]
> These generators are published to a **local Verdaccio registry** at `http://localhost:4873`. The registry must be running before you install or use the generators. See [PUBLISHING.md](../../PUBLISHING.md) to start it and publish the latest version.

In your **consumer Nx workspace**, point pnpm at the local registry for this scope:

```bash
# Option A: add to .npmrc in your consumer workspace root
echo "@interview-tools:registry=http://localhost:4873/" >> .npmrc

# Then install
pnpm add -D -w @interview-tools/nextjs-generators
```

```bash
# Option B: install with --registry flag directly
pnpm add -D -w @interview-tools/nextjs-generators --registry http://localhost:4873
```

---

## 1. Frontend generator

Scaffolds a **frontend-only** Next.js React application.

### Run the generator

```bash
# Minimal — name is the only required argument
pnpm nx g @interview-tools/nextjs-generators:frontend my-app

# Custom directory
pnpm nx g @interview-tools/nextjs-generators:frontend my-app --directory=apps/interview/my-app

# Use SCSS instead of CSS
pnpm nx g @interview-tools/nextjs-generators:frontend my-app --style=scss

# Pages Router instead of App Router
pnpm nx g @interview-tools/nextjs-generators:frontend my-app --appDir=false

# No stylesheet (bring your own)
pnpm nx g @interview-tools/nextjs-generators:frontend my-app --style=none

# Dry run — preview changes without writing files
pnpm nx g @interview-tools/nextjs-generators:frontend my-app --dry-run
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | *(required)* | Application name; becomes the Nx project name |
| `--directory` | `string` | `apps/<name>` | Directory where the app will be created |
| `--style` | `css` \| `scss` \| `none` | `css` | Stylesheet format |
| `--appDir` | `boolean` | `true` | `true` = Next.js App Router, `false` = Pages Router |

### Validate the frontend app works

**1. Start the dev server:**

```bash
pnpm nx dev my-app
```

**2. Open the app:**

Navigate to [http://localhost:4200](http://localhost:4200). You should see the Next.js default page.

**3. Run unit tests:**

```bash
pnpm nx test my-app
```

All tests should pass with no errors.

---

## 2. Fullstack generator

Scaffolds a **complete fullstack application** consisting of:

- **Next.js + React frontend** (`apps/<name>`) — dev server on `:4200`
- **Express REST API** (`apps/<name>-api`) — server on `:3000`
- **SQLite database** via Prisma ORM (`apps/<name>-api/prisma/dev.db`)
- **API proxy** — requests to `/api/*` in the frontend automatically rewrite to `:3000`

### Run the generator

```bash
# Minimal — creates <name> (frontend) and <name>-api (Express)
pnpm nx g @interview-tools/nextjs-generators:fullstack my-app

# Custom frontend directory (API always goes in apps/<name>-api)
pnpm nx g @interview-tools/nextjs-generators:fullstack my-app --directory=apps/interview/my-app

# SCSS styling
pnpm nx g @interview-tools/nextjs-generators:fullstack my-app --style=scss

# Pages Router
pnpm nx g @interview-tools/nextjs-generators:fullstack my-app --appDir=false

# No stylesheet
pnpm nx g @interview-tools/nextjs-generators:fullstack my-app --style=none

# Dry run
pnpm nx g @interview-tools/nextjs-generators:fullstack my-app --dry-run
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | *(required)* | Base name; frontend is `<name>`, API is `<name>-api` |
| `--directory` | `string` | `apps/<name>` | Directory for the **frontend** project |
| `--style` | `css` \| `scss` \| `none` | `css` | Stylesheet format for the frontend |
| `--appDir` | `boolean` | `true` | `true` = App Router, `false` = Pages Router |

### Validate the fullstack app works

**1. Set up the database:**

```bash
# Push the Prisma schema to SQLite and create dev.db
pnpm nx db-push my-app-api

# (Optional) seed with sample data
pnpm nx db-seed my-app-api
```

**2. Start the Express API** (keep this terminal running):

```bash
pnpm nx serve my-app-api
```

Verify the API is healthy:

```bash
curl http://localhost:3000/api/health
# → { "status": "ok" }

curl http://localhost:3000/api/items
# → [] (or seeded data)
```

**3. Start the Next.js frontend** (open a second terminal):

```bash
pnpm nx dev my-app
```

Navigate to [http://localhost:4200](http://localhost:4200). The dashboard should load and display data from the API (proxied through `/api/*`).

**4. Run unit tests:**

```bash
# Test just the frontend
pnpm nx test my-app

# Test just the API
pnpm nx test my-app-api

# Test both at once
pnpm nx run-many -t test -p my-app my-app-api
```

### Additional database commands

```bash
# Open Prisma Studio (browser GUI for the database)
pnpm nx db-studio my-app-api

# Create and apply a migration
pnpm nx db-migrate my-app-api
```
