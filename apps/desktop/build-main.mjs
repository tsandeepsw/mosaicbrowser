import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 1. Bundle main process
await build({
  entryPoints: [resolve(__dirname, 'src/main/index.ts')],
  outfile: resolve(__dirname, 'dist/main/index.js'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  external: [
    'electron',
    'better-sqlite3',
  ],
  logLevel: 'info',
});

// 2. Bundle preload scripts
await build({
  entryPoints: [
    resolve(__dirname, 'src/preload/index.ts'),
    resolve(__dirname, 'src/preload/viewPreload.ts'),
  ],
  outdir: resolve(__dirname, 'dist/preload'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  external: ['electron'],
  logLevel: 'info',
});

// 3. Copy icon assets to dist
import { copyFileSync, existsSync } from 'fs';
const rootBuildDir = resolve(__dirname, '../../build');
if (existsSync(resolve(rootBuildDir, 'icon.png'))) {
  copyFileSync(resolve(rootBuildDir, 'icon.png'), resolve(__dirname, 'dist/icon.png'));
}
if (existsSync(resolve(rootBuildDir, 'icon.ico'))) {
  copyFileSync(resolve(rootBuildDir, 'icon.ico'), resolve(__dirname, 'dist/icon.ico'));
}

console.log('✓ Main process, preload scripts, and icon assets bundled successfully.');


