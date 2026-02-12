#!/usr/bin/env node

/**
 * Script para fazer build do servidor como sidecar para o Tauri
 * Usa esbuild para bundling com native addons como externals
 */

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { copyFileSync, mkdirSync, existsSync, writeFileSync, cpSync, chmodSync } from 'node:fs';
import { execSync } from 'node:child_process';

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
  format: 'cjs',
  outfile: join(bundleDir, 'server.js'),
  external: [
    'better-sqlite3',
    'vectordb',
    'pino-pretty', // Evita worker threads
    'fsevents', // macOS only, pode ser problemático em bundle
  ],
  define: {
    // Em CJS, __filename e __dirname já existem, então podemos mapear import.meta.url
    'import.meta.url': '__filenameUrl',
  },
  banner: {
    js: `const { pathToFileURL } = require('url'); const __filenameUrl = pathToFileURL(__filename).href;`,
  },
  logLevel: 'info',
  minify: false, // Facilita debug
  sourcemap: true,
});

console.log('✅ Server code bundled');

// 2. Cria package.json mínimo para instalar deps via pnpm
console.log('📦 Installing native dependencies...');

// Lê as versões do package.json do server
const serverPackageJson = JSON.parse(
  await import('node:fs/promises').then(fs => 
    fs.readFile(join(rootDir, 'apps/server/package.json'), 'utf-8')
  )
);

// Cria package.json com apenas as deps nativas necessárias
const bundlePackageJson = {
  name: 'openprofia-server-bundle',
  version: '0.1.0',
  private: true,
  dependencies: {
    'better-sqlite3': serverPackageJson.dependencies['better-sqlite3'],
    'vectordb': serverPackageJson.dependencies['vectordb'],
  }
};

writeFileSync(
  join(bundleDir, 'package.json'),
  JSON.stringify(bundlePackageJson, null, 2)
);

// Instala as dependências no bundle usando npm (para evitar conflito com workspace pnpm)
try {
  console.log('  Installing via npm...');
  execSync('npm install --omit=dev', {
    cwd: bundleDir,
    stdio: 'inherit',
  });
  console.log('✅ Native dependencies installed');
} catch (err) {
  console.error('❌ Failed to install dependencies:', err.message);
  process.exit(1);
}

// 3. Copia arquivos de migrations do banco de dados
console.log('📄 Copying database migrations...');

const migrationsSourceDir = join(rootDir, 'apps/server/src/db/migrations');
const migrationsBundleDir = join(bundleDir, 'migrations');

if (existsSync(migrationsSourceDir)) {
  cpSync(migrationsSourceDir, migrationsBundleDir, { recursive: true });
  console.log('✅ Migrations copied');
} else {
  console.warn('⚠️  Migrations directory not found');
}

// 4. Copia skills built-in
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

# Encontra o diretório do bundle
# Em dev: target/debug/server-bundle (copiado pelo Tauri)
# Em produção: mesmo diretório do binário
if [ -d "$SCRIPT_DIR/server-bundle" ]; then
  BUNDLE_DIR="$SCRIPT_DIR/server-bundle"
elif [ -d "$SCRIPT_DIR/../binaries/server-bundle" ]; then
  # Fallback para o diretório original se não foi copiado ainda
  BUNDLE_DIR="$SCRIPT_DIR/../binaries/server-bundle"
else
  echo "ERROR: server-bundle not found" >&2
  exit 1
fi

# Define NODE_PATH para encontrar os módulos nativos
export NODE_PATH="$BUNDLE_DIR/node_modules"

# Define NODE_ENV como production para desabilitar pino-pretty
export NODE_ENV="production"

# Define SIDECAR_MODE para desabilitar Swagger
export SIDECAR_MODE="1"

# Tenta encontrar node em locais comuns
if [ -n "$NODE_PATH_OVERRIDE" ]; then
  NODE_BIN="$NODE_PATH_OVERRIDE"
elif command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
elif [ -f "/usr/local/bin/node" ]; then
  NODE_BIN="/usr/local/bin/node"
elif [ -f "$HOME/.nvm/versions/node/v22.18.0/bin/node" ]; then
  NODE_BIN="$HOME/.nvm/versions/node/v22.18.0/bin/node"
elif [ -f "/opt/homebrew/bin/node" ]; then
  NODE_BIN="/opt/homebrew/bin/node"
else
  echo "ERROR: Node.js not found. Please install Node.js or set NODE_PATH_OVERRIDE" >&2
  exit 1
fi

echo "[Wrapper] Using Node.js: $NODE_BIN" >&2
echo "[Wrapper] Bundle dir: $BUNDLE_DIR" >&2
echo "[Wrapper] Data dir: $OPENPROFIA_DATA_DIR" >&2

# Muda para o diretório do bundle antes de executar (para que process.cwd() seja o bundle)
cd "$BUNDLE_DIR"

# Executa o servidor
exec "$NODE_BIN" "$BUNDLE_DIR/server.js" "$@"
`;

// Escreve o wrapper (por enquanto apenas macOS)
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
