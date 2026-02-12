#!/bin/bash
# Script para preparar o sidecar para desenvolvimento
# Copia server-bundle para target/debug onde o Tauri espera encontrar

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLIENT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TAURI_DIR="$CLIENT_DIR/src-tauri"
BINARIES_DIR="$TAURI_DIR/binaries"
TARGET_DEBUG="$TAURI_DIR/target/debug"

# Cria o diretório target/debug se não existir
mkdir -p "$TARGET_DEBUG"

echo "📦 Preparing sidecar for development..."

# Copia server-bundle se existir
if [ -d "$BINARIES_DIR/server-bundle" ]; then
  echo "  Copying server-bundle to $TARGET_DEBUG/"
  cp -r "$BINARIES_DIR/server-bundle" "$TARGET_DEBUG/"
  echo "✅ Sidecar resources copied"
else
  echo "⚠️  Warning: server-bundle not found at $BINARIES_DIR/server-bundle"
  echo "   Run: node scripts/build-sidecar.mjs from project root"
  exit 1
fi
