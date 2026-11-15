# @interview-tools/nextjs-generators

A publishable Nx plugin containing generators for scaffolding Next.js applications in an Nx workspace using **pnpm**.

## Features

- 🌐 **`frontend` Generator**: Scaffolds a frontend-only Next.js application with React, vitest unit tests, and pre-configured dev server.
- 🚀 **`fullstack` Generator**: Scaffolds a fullstack Next.js application with an Express API backend, SQLite database managed via Prisma ORM, and integrated proxy routing.
- 📦 **pnpm First**: Built and optimized for pnpm workspaces.
- 🧩 **Nx Standard Generators**: Composes official `@nx/next` and `@nx/express` generators with custom templates, targets, and database tooling.

---

## Installation & Setup

Install the plugin in any Nx workspace:

```bash
pnpm add -D -w @interview-tools/nextjs-generators
```

Or add via Nx:

```bash
pnpm nx add @interview-tools/nextjs-generators
```

---

## 1. Frontend Generator (`frontend`)

Scaffold a frontend-only Next.js React application:

```bash
pnpm nx g @interview-tools/nextjs-generators:frontend my-site
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `--name` | `string` | *(Required)* | Application name |
| `--directory` | `string` | `apps/<name>` | Directory where the application will be created |
| `--style` | `css` \| `scss` \| `none` | `css` | Stylesheet format |
| `--appDir` | `boolean` | `true` | Enable Next.js App Router (set to `false` for Pages Router) |

### Start the Frontend Dev Server

```bash
pnpm nx dev my-site
```
Opens locally at [http://localhost:4200](http://localhost:4200).

---

## 2. Fullstack Generator (`fullstack`)

Scaffold a complete fullstack application consisting of:
- **Next.js + React Frontend** (`apps/<name>`) running on `:4200`
- **Express REST API Server** (`apps/<name>-api`) running on `:3000`
- **SQLite Database with Prisma ORM** (`apps/<name>-api/prisma/dev.db`)
- **API Proxy Routing** (`/api/*` in Next.js automatically rewrites to `:3000`)

```bash
pnpm nx g @interview-tools/nextjs-generators:fullstack my-fullstack
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `--name` | `string` | *(Required)* | Application base name (frontend: `<name>`, API: `<name>-api`) |
| `--directory` | `string` | `apps/<name>` | Directory where frontend will be created |
| `--style` | `css` \| `scss` \| `none` | `css` | Stylesheet format for frontend |
| `--appDir` | `boolean` | `true` | Enable Next.js App Router (set to `false` for Pages Router) |

### Fullstack Commands

#### 1. Database Operations (SQLite + Prisma)
```bash
# Push schema to SQLite database (creates dev.db)
pnpm nx db-push my-fullstack-api

# Seed the database with sample data
pnpm nx db-seed my-fullstack-api

# Open Prisma Studio GUI in browser
pnpm nx db-studio my-fullstack-api

# Create and run database migrations
pnpm nx db-migrate my-fullstack-api
```

#### 2. Start Express Web Server (:3000)
```bash
pnpm nx serve my-fullstack-api
```
- Health Check: `http://localhost:3000/api/health`
- Items CRUD: `http://localhost:3000/api/items`

#### 3. Start Next.js Frontend Dev Server (:4200)
```bash
pnpm nx dev my-fullstack
```
- Interactive Dashboard: `http://localhost:4200`
- API calls to `/api/*` are automatically proxied to the Express backend.

---

## Publishing to npm

To build and publish this plugin:

```bash
# 1. Build the plugin
pnpm nx build nextjs-generators

# 2. Publish to npm registry
cd packages/nextjs-generators/dist
npm publish --access public
```
