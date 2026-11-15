import {
  formatFiles,
  installPackagesTask,
  type Tree,
} from '@nx/devkit';
import { applicationGenerator as nextApplicationGenerator } from '@nx/next';
import type { FrontendGeneratorSchema } from './schema';

export async function frontendGenerator(
  tree: Tree,
  options: FrontendGeneratorSchema,
) {
  const appDirectory = options.directory || `apps/${options.name}`;
  const isAppDir = options.appDir !== false;

  // 1. Run official @nx/next application generator
  await nextApplicationGenerator(tree, {
    name: options.name,
    directory: appDirectory,
    style: options.style || 'css',
    appDir: isAppDir,
    src: true,
    unitTestRunner: 'vitest',
    e2eTestRunner: 'none',
    skipFormat: true,
  });

  // 2. Enhance the homepage with a clean starter template
  if (isAppDir) {
    const pagePath = `${appDirectory}/src/app/page.tsx`;
    if (tree.exists(pagePath)) {
      tree.write(
        pagePath,
        `export default function Index() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '40px auto', padding: '0 20px', lineHeight: 1.6 }}>
      <header style={{ marginBottom: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 8px 0', color: '#111827' }}>
          ${options.name}
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '1.1rem' }}>
          Next.js + React Frontend Application
        </p>
      </header>

      <section style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '24px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.25rem', marginTop: 0, color: '#1f2937' }}>🚀 Getting Started</h2>
        <p style={{ color: '#4b5563' }}>
          Start the frontend development server:
        </p>
        <pre style={{ backgroundColor: '#1f2937', color: '#f3f4f6', padding: '12px 16px', borderRadius: '6px', overflowX: 'auto' }}>
          <code>pnpm nx dev ${options.name}</code>
        </pre>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 0 }}>
          Runs locally at <a href="http://localhost:4200" style={{ color: '#2563eb' }}>http://localhost:4200</a>
        </p>
      </section>

      <section style={{ color: '#4b5563' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#1f2937' }}>📁 Project Structure</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li><code>src/app/layout.tsx</code> — Root layout</li>
          <li><code>src/app/page.tsx</code> — Home page</li>
          <li><code>project.json</code> — Nx project targets (build, dev, test)</li>
        </ul>
      </section>
    </main>
  );
}
`
      );
    }
  }

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
  };
}

export default frontendGenerator;
