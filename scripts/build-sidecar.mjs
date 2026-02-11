#!/usr/bin/env node

/**
 * Script para fazer build do servidor como sidecar para o Tauri
 * Usa esbuild para bundling com native addons como externals
 */

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const serverSrcDir = join(rootDir, 'apps/server/src');
const serverDistDir = join(rootDir, 'apps/server/dist');
const clientTauriDir = join(rootDir, 'apps/client/src-tauri');
const binariesDir = join(clientTauriDir, 'binaries');
const bundleDir = join(binariesDir, 'server-bundle');

console.log('📦 Building server sidecar...');

// Cria diretórios
mkdirSync(bundleDir, { recursive: true });

// 1. Bundle do server com esbuild
console.log('🔨 Bundling server code with esbuild...');

await build({
  entryPoints: [join(serverSrcDir, 'index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: join(bundleDir, 'server.mjs'),
  external: [
    'better-sqlite3',
    'vectordb',
    'pino-pretty',
    '@fastify/*',
    'fsevents', // macOS only, pode ser problemático em bundle
  ],
  logLevel: 'info',
  minify: false, // Facilita debug
  sourcemap: true,
});

console.log('✅ Server code bundled');

// 2. Copia dependências nativas
console.log('📦 Copying native dependencies...');

const nativeModulesDir = join(rootDir, 'node_modules');

// Nota: Em produção, precisaríamos copiar os binários .node prebuilt
// Por enquanto, vamos apenas criar uma nota sobre isso
const nativeDepsNote = `
# Native Dependencies

Os módulos nativos (better-sqlite3, vectordb) precisam ser copiados manualmente:
- better-sqlite3: node_modules/better-sqlite3/build/Release/better_sqlite3.node
- vectordb: node_modules/vectordb/native (binários complexos)

Para build de produção, esses binários devem ser compilados para cada plataforma-alvo.
`;

// 3. Copia skills built-in
console.log('📚 Copying built-in skills...');

const skillsSourceDir = join(rootDir, 'packages/skills');
const skillsBundleDir = join(bundleDir, 'skills');

try {
  mkdirSync(skillsBundleDir, { recursive: true });
  
  // Copia cada skill (apenas os manifestos e prompts, não os uploads)
  const skills = ['gerador-questoes'];
  for (const skill of skills) {
    const skillDir = join(skillsSourceDir, skill);
    if (existsSync(skillDir)) {
      const targetDir = join(skillsBundleDir, skill);
      mkdirSync(targetDir, { recursive: true });
      
      // Copia manifest.json e prompt.md
      const files = ['manifest.json', 'prompt.md'];
      for (const file of files) {
        const src = join(skillDir, file);
        const dest = join(targetDir, file);
        if (existsSync(src)) {
          copyFileSync(src, dest);
        }
      }
    }
  }
  
  console.log('✅ Skills copied');
} catch (err) {
  console.warn('⚠️  Could not copy skills:', err.message);
}

// 4. Cria wrapper script para cada plataforma
console.log('📝 Creating platform wrapper scripts...');

// Para desenvolvimento, vamos criar um wrapper simples que usa o node do PATH
const macWrapperScript = `#!/bin/bash
# OpenProfIA Server Sidecar Wrapper (macOS)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUNDLE_DIR="$SCRIPT_DIR/server-bundle"

# Usa o node do PATH (para desenvolvimento)
# Em produção, apontaria para um node runtime embarcado
exec node "$BUNDLE_DIR/server.mjs" "$@"
`;

// Escreve o wrapper (por enquanto apenas macOS)
import { writeFileSync, chmodSync } from 'node:fs';

const macWrapperPath = join(binariesDir, 'openprofia-server-aarch64-apple-darwin');
writeFileSync(macWrapperPath, macWrapperScript);
chmodSync(macWrapperPath, 0o755);

// Cria também para x86_64 macOS (mesmo script)
const macX64WrapperPath = join(binariesDir, 'openprofia-server-x86_64-apple-darwin');
writeFileSync(macX64WrapperPath, macWrapperScript);
chmodSync(macX64WrapperPath, 0o755);

console.log('✅ Wrapper scripts created');

console.log('\n🎉 Server sidecar build complete!');
console.log('\n⚠️  IMPORTANTE: Este é um build de desenvolvimento.');
console.log('Para produção, você precisará:');
console.log('  1. Compilar/copiar binários nativos (better-sqlite3, vectordb) para cada plataforma');
console.log('  2. Embutir o Node.js runtime (ou usar pkg/nexe)');
console.log('  3. Criar wrappers para Windows (.exe ou .cmd) e Linux');
console.log(`\n📁 Output: ${binariesDir}`);
