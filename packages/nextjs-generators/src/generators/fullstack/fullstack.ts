import {
  addDependenciesToPackageJson,
  formatFiles,
  installPackagesTask,
  readProjectConfiguration,
  updateProjectConfiguration,
  type Tree,
} from '@nx/devkit';
import { applicationGenerator as nextApplicationGenerator } from '@nx/next';
import { applicationGenerator as expressApplicationGenerator } from '@nx/express';
import type { FullstackGeneratorSchema } from './schema';

export async function fullstackGenerator(
  tree: Tree,
  options: FullstackGeneratorSchema,
) {
  const frontendName = options.name;
  const apiName = `${options.name}-api`;
  const frontendDirectory = options.directory || `apps/${frontendName}`;
  const apiDirectory = `apps/${apiName}`;
  const isAppDir = options.appDir !== false;

  // 1. Generate Next.js Frontend App
  await nextApplicationGenerator(tree, {
    name: frontendName,
    directory: frontendDirectory,
    style: options.style || 'css',
    appDir: isAppDir,
    src: true,
    unitTestRunner: 'vitest',
    e2eTestRunner: 'none',
    skipFormat: true,
  });

  // 2. Generate Express API App
  await expressApplicationGenerator(tree, {
    name: apiName,
    directory: apiDirectory,
    frontendProject: frontendName,
    unitTestRunner: 'vitest',
    skipFormat: true,
    skipPackageJson: false,
    js: false,
  });

  // 3. Add Prisma, SQLite & Express dependencies
  addDependenciesToPackageJson(
    tree,
    {
      '@prisma/client': '^5.22.0',
      cors: '^2.8.5',
    },
    {
      prisma: '^5.22.0',
      tsx: '^4.19.0',
      '@types/cors': '^2.8.17',
    },
  );

  // 4. Create Prisma SQLite Schema in API project
  tree.write(
    `${apiDirectory}/prisma/schema.prisma`,
    `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Item {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
`,
  );

  // 5. Create Prisma Seed Script
  tree.write(
    `${apiDirectory}/prisma/seed.ts`,
    `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SQLite database...');
  await prisma.item.deleteMany({});
  await prisma.item.createMany({
    data: [
      {
        title: 'Welcome to Next.js + Express + SQLite',
        description: 'Seeded record from prisma/seed.ts',
        completed: true,
      },
      {
        title: 'Database initialized',
        description: 'SQLite database running via Prisma',
        completed: true,
      },
      {
        title: 'Fullstack application ready',
        description: 'Frontend (:4200) + Express API (:3000)',
        completed: false,
      },
    ],
  });
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`,
  );

  // 6. Create Prisma Client Singleton
  tree.write(
    `${apiDirectory}/src/prisma.ts`,
    `import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
`,
  );

  // 7. Update Express entry file (main.ts)
  tree.write(
    `${apiDirectory}/src/main.ts`,
    `import express from 'express';
import cors from 'cors';
import { prisma } from './prisma';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '${apiName}',
    database: 'sqlite',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items', message: String(err) });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const item = await prisma.item.create({
      data: { title, description, completed: false },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create item', message: String(err) });
  }
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(\`Express API server listening at http://localhost:\${port}\`);
  console.log(\`Health check: http://localhost:\${port}/api/health\`);
  console.log(\`Items API:   http://localhost:\${port}/api/items\`);
});
server.on('error', console.error);
`,
  );

  // 8. Add Database Targets to Express project.json
  const apiConfig = readProjectConfiguration(tree, apiName);
  apiConfig.targets = {
    ...apiConfig.targets,
    'db-generate': {
      executor: 'nx:run-commands',
      options: {
        command: `pnpm exec prisma generate --schema=${apiDirectory}/prisma/schema.prisma`,
      },
    },
    'db-push': {
      executor: 'nx:run-commands',
      options: {
        command: `pnpm exec prisma db push --schema=${apiDirectory}/prisma/schema.prisma`,
      },
    },
    'db-migrate': {
      executor: 'nx:run-commands',
      options: {
        command: `pnpm exec prisma migrate dev --schema=${apiDirectory}/prisma/schema.prisma`,
      },
    },
    'db-seed': {
      executor: 'nx:run-commands',
      options: {
        command: `pnpm exec tsx ${apiDirectory}/prisma/seed.ts`,
      },
    },
    'db-studio': {
      executor: 'nx:run-commands',
      options: {
        command: `pnpm exec prisma studio --schema=${apiDirectory}/prisma/schema.prisma`,
      },
    },
  };
  updateProjectConfiguration(tree, apiName, apiConfig);

  // 9. Update next.config.js with rewrites for proxying /api to Express server on :3000
  const nextConfigPath = `${frontendDirectory}/next.config.js`;
  if (tree.exists(nextConfigPath)) {
    tree.write(
      nextConfigPath,
      `//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    svgr: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

const plugins = [
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
`,
    );
  }

  // 10. Update Frontend homepage with fullstack instructions & live status
  if (isAppDir) {
    const pagePath = `${frontendDirectory}/src/app/page.tsx`;
    if (tree.exists(pagePath)) {
      tree.write(
        pagePath,
        `export default function Index() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '860px', margin: '40px auto', padding: '0 20px', lineHeight: 1.6 }}>
      <header style={{ marginBottom: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 8px 0', color: '#111827' }}>
          ${frontendName}
        </h1>
        <p style={{ color: '#4b5563', margin: 0, fontSize: '1.2rem' }}>
          Full-Stack Application: Next.js + React + Express + SQLite (Prisma)
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f0fdf4' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Frontend</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#14532d', marginTop: '4px' }}>Next.js (React)</div>
          <div style={{ fontSize: '0.9rem', color: '#16a34a', marginTop: '4px' }}>Port :4200</div>
        </div>

        <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#eff6ff' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase' }}>API Server</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e3a8a', marginTop: '4px' }}>Express</div>
          <div style={{ fontSize: '0.9rem', color: '#2563eb', marginTop: '4px' }}>Port :3000 (proxied via /api)</div>
        </div>

        <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#faf5ff' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6b21a8', textTransform: 'uppercase' }}>Database</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#581c87', marginTop: '4px' }}>SQLite</div>
          <div style={{ fontSize: '0.9rem', color: '#7c3aed', marginTop: '4px' }}>Prisma ORM</div>
        </div>
      </section>

      <section style={{ backgroundColor: '#111827', color: '#f3f4f6', borderRadius: '10px', padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.35rem', marginTop: 0, color: '#fff', borderBottom: '1px solid #374151', paddingBottom: '12px' }}>
          ⚡ Service Commands
        </h2>

        <div style={{ marginTop: '16px' }}>
          <p style={{ margin: '0 0 6px 0', color: '#9ca3af', fontWeight: 600 }}>1. Initialize / Push SQLite Database:</p>
          <pre style={{ backgroundColor: '#1f2937', padding: '10px 14px', borderRadius: '6px', margin: 0 }}>
            <code>pnpm nx db-push ${apiName} && pnpm nx db-seed ${apiName}</code>
          </pre>
        </div>

        <div style={{ marginTop: '16px' }}>
          <p style={{ margin: '0 0 6px 0', color: '#9ca3af', fontWeight: 600 }}>2. Start Express Web Server (:3000):</p>
          <pre style={{ backgroundColor: '#1f2937', padding: '10px 14px', borderRadius: '6px', margin: 0 }}>
            <code>pnpm nx serve ${apiName}</code>
          </pre>
        </div>

        <div style={{ marginTop: '16px' }}>
          <p style={{ margin: '0 0 6px 0', color: '#9ca3af', fontWeight: 600 }}>3. Start Next.js Frontend Dev Server (:4200):</p>
          <pre style={{ backgroundColor: '#1f2937', padding: '10px 14px', borderRadius: '6px', margin: 0 }}>
            <code>pnpm nx dev ${frontendName}</code>
          </pre>
        </div>

        <div style={{ marginTop: '16px' }}>
          <p style={{ margin: '0 0 6px 0', color: '#9ca3af', fontWeight: 600 }}>4. Open Prisma Database GUI Studio:</p>
          <pre style={{ backgroundColor: '#1f2937', padding: '10px 14px', borderRadius: '6px', margin: 0 }}>
            <code>pnpm nx db-studio ${apiName}</code>
          </pre>
        </div>
      </section>

      <section style={{ color: '#4b5563' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#1f2937' }}>📁 Project Structure</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li><code>${frontendDirectory}/src/app/</code> — Next.js React frontend</li>
          <li><code>${apiDirectory}/src/main.ts</code> — Express REST API entry</li>
          <li><code>${apiDirectory}/prisma/schema.prisma</code> — SQLite schema definition</li>
          <li><code>${apiDirectory}/prisma/seed.ts</code> — Database seed script</li>
        </ul>
      </section>
    </main>
  );
}
`,
      );
    }
  }

  // 11. Ensure *.db is gitignored
  if (tree.exists('.gitignore')) {
    const gitignoreContent = tree.read('.gitignore', 'utf-8') || '';
    if (!gitignoreContent.includes('*.db')) {
      tree.write(
        '.gitignore',
        `${gitignoreContent.trimEnd()}\n\n# SQLite database\n*.db\n*.db-journal\n`,
      );
    }
  }

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
  };
}

export default fullstackGenerator;
