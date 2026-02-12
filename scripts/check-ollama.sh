#!/bin/bash

# Script para verificar status do Ollama

echo "=== Verificando Ollama ==="
echo ""

# 1. Verifica se ollama está instalado
echo "1. Verificando instalação..."
if command -v ollama &> /dev/null; then
    echo "   ✅ Ollama instalado: $(ollama --version)"
else
    echo "   ❌ Ollama não encontrado no PATH"
    echo "   💡 Instale em: https://ollama.ai"
    exit 1
fi

echo ""

# 2. Verifica se o serviço está rodando
echo "2. Verificando se o serviço está rodando..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "   ✅ Ollama está rodando em http://localhost:11434"
else
    echo "   ❌ Ollama não está respondendo em http://localhost:11434"
    echo "   💡 Inicie com: ollama serve"
    exit 1
fi

echo ""

# 3. Lista modelos instalados
echo "3. Modelos instalados:"
MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

if [ -z "$MODELS" ]; then
    echo "   ⚠️  Nenhum modelo instalado"
    echo "   💡 Baixe os modelos recomendados:"
    echo "      ollama pull gemma2:2b"
    echo "      ollama pull nomic-embed-text"
else
    echo "$MODELS" | while read -r model; do
        echo "   ✅ $model"
    done
fi

echo ""

# 4. Verifica modelos recomendados
echo "4. Verificando modelos recomendados:"
RECOMMENDED=("gemma2:2b" "nomic-embed-text")

for model in "${RECOMMENDED[@]}"; do
    if echo "$MODELS" | grep -q "^${model}"; then
        echo "   ✅ $model"
    else
        echo "   ❌ $model (não instalado)"
        echo "      Execute: ollama pull $model"
    fi
done

echo ""
echo "=== Verificação completa ==="
