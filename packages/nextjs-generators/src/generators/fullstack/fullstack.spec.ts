import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { fullstackGenerator } from './fullstack';
import { FullstackGeneratorSchema } from './schema';

describe('fullstack generator', () => {
  let tree: Tree;
  const options: FullstackGeneratorSchema = { name: 'my-fullstack' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate Next.js frontend, Express backend, and Prisma SQLite setup', async () => {
    await fullstackGenerator(tree, options);

    // Verify frontend project
    const frontendConfig = readProjectConfiguration(tree, 'my-fullstack');
    expect(frontendConfig).toBeDefined();
    expect(tree.exists('apps/my-fullstack/src/app/page.tsx')).toBeTruthy();

    // Verify Express API project
    const apiConfig = readProjectConfiguration(tree, 'my-fullstack-api');
    expect(apiConfig).toBeDefined();
    expect(tree.exists('apps/my-fullstack-api/src/main.ts')).toBeTruthy();

    // Verify Prisma SQLite files
    expect(tree.exists('apps/my-fullstack-api/prisma/schema.prisma')).toBeTruthy();
    expect(tree.exists('apps/my-fullstack-api/prisma/seed.ts')).toBeTruthy();
    expect(tree.exists('apps/my-fullstack-api/src/prisma.ts')).toBeTruthy();

    const prismaSchema = tree.read('apps/my-fullstack-api/prisma/schema.prisma', 'utf-8');
    expect(prismaSchema).toContain('provider = "sqlite"');

    // Verify database targets in project.json
    expect(apiConfig.targets).toBeDefined();
    expect(apiConfig.targets?.['db-push']).toBeDefined();
    expect(apiConfig.targets?.['db-migrate']).toBeDefined();
    expect(apiConfig.targets?.['db-seed']).toBeDefined();
    expect(apiConfig.targets?.['db-studio']).toBeDefined();

    // Verify .gitignore was updated
    const gitignore = tree.read('.gitignore', 'utf-8');
    expect(gitignore).toContain('*.db');
  }, 240_000);
});
