import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { frontendGenerator } from './frontend';
import { FrontendGeneratorSchema } from './schema';

describe('frontend generator', () => {
  let tree: Tree;
  const options: FrontendGeneratorSchema = { name: 'test-app' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully and create Next.js frontend project', async () => {
    await frontendGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test-app');
    expect(config).toBeDefined();
    expect(tree.exists('apps/test-app/src/app/page.tsx')).toBeTruthy();
  }, 120_000);
});
