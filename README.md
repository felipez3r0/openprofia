# OpenProfIA

Plataforma de IA Open Source local-first para educação K-12.

## 📚 Visão Geral

OpenProfIA democratiza o acesso à IA para professores através de uma plataforma que roda em hardware doméstico (sem necessidade de GPU dedicada), usando LLMs locais via Ollama e sistema de extensibilidade baseado em "Skills" comunitárias.

## 🏗️ Arquitetura

Monorepo composto por:

- **`apps/server`** - API Fastify + RAG + Worker de background
- **`apps/client`** - Desktop app (Tauri + React) _(a ser implementado)_
- **`packages/core`** - Tipos e interfaces compartilhadas (TypeScript)
- **`packages/storage`** - Dados persistentes (SQLite + LanceDB)
- **`packages/skills`** - Skills instaladas (pacotes .zip declarativos)

## 🚀 Quick Start

### Pré-requisitos

- Node.js >= 22 LTS
- pnpm >= 9
- Ollama instalado e rodando (`http://localhost:11434`)

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd openprofia

# Instala dependências
pnpm install

# Copia .env de exemplo
cp .env.example .env

# Inicia o servidor em modo dev
pnpm dev
```

### Modelos Ollama Recomendados

```bash
# Modelo de chat (escolha um)
ollama pull gemma2:2b
# ou
ollama pull phi3

# Modelo de embedding
ollama pull nomic-embed-text
```

## 📖 Documentação

- [Arquitetura](docs/ARCHITECT.md) - Detalhes técnicos da arquitetura
- [Coding Guidelines](AGENTS.md) - Padrões e regras de desenvolvimento
- [API Docs](http://localhost:3000/docs) - Swagger (após iniciar o server)

## 🛠️ Desenvolvimento

```bash
# Desenvolvimento (watch mode)
pnpm dev

# Build de produção
pnpm build

# Typecheck
pnpm typecheck

# Limpar build artifacts
pnpm clean
```

### Estrutura de Scripts

- `pnpm --filter @openprofia/server dev` - Roda apenas o server
- `pnpm --filter @openprofia/core build` - Compila apenas o core
- `turbo dev` - Roda todos os workspaces em modo dev

## 🔌 API Endpoints

| Endpoint                       | Método | Descrição                              |
| ------------------------------ | ------ | -------------------------------------- |
| `/health`                      | GET    | Health check básico                    |
| `/health/detailed`             | GET    | Health check com status de serviços    |
| `/api/chat`                    | POST   | Chat não-streaming                     |
| `/api/chat/stream`             | POST   | Chat com SSE streaming                 |
| `/api/skills`                  | GET    | Lista skills instaladas                |
| `/api/skills`                  | POST   | Upload de nova skill (.zip)            |
| `/api/skills/:id`              | DELETE | Remove uma skill                       |
| `/api/documents/upload`        | POST   | Upload de documento para processamento |
| `/api/documents/:jobId/status` | GET    | Status de processamento                |
| `/api/documents/jobs/:skillId` | GET    | Lista jobs de uma skill                |

## 🧩 Sistema de Skills

Skills são pacotes `.zip` declarativos contendo:

```
my-skill.zip
├── manifest.json    # Metadados e configurações
├── prompt.md        # System prompt da IA
└── knowledge/       # Documentos base (opcional)
    ├── doc1.pdf
    └── doc2.txt
```

### Regras de Segurança

- ✅ Puramente declarativas (JSON + Markdown + arquivos de conhecimento)
- ❌ **Proibido** código executável (`.js`, `.sh`, `.bin`, `.exe`, etc.)
- ✅ Apenas consomem Tools pré-implementadas no Core do Server

### Exemplo de manifest.json

```json
{
  "id": "lesson-planner",
  "name": "Planejador de Aulas",
  "version": "1.0.0",
  "description": "Auxilia na criação de planos de aula",
  "author": "Community",
  "capabilities": ["planning", "curriculum"],
  "tools": [],
  "modelPreferences": {
    "chat": "gemma2:2b",
    "embedding": "nomic-embed-text"
  }
}
```

## 🗄️ Banco de Dados

- **SQLite** - Jobs, skills, configurações
- **LanceDB** - Índices vetoriais para RAG (scoped por skill)

Localização: `packages/storage/`

## 🔄 Background Worker

Processamento assíncrono de documentos:

1. Upload → cria job no SQLite
2. Worker (poll a cada 5s) → extrai texto
3. Chunking → divisão em fragmentos (~500 caracteres)
4. Embedding → via Ollama
5. Indexação → LanceDB (vinculado à skill)

## 🌐 Variáveis de Ambiente

Ver `.env.example` para lista completa. Principais:

```env
PORT=3000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=gemma2:2b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
MAX_CONTEXT_CHUNKS=5
CHUNK_SIZE=500
```

## 📝 Licença

MIT

## 🤝 Contribuindo

_(a definir)_

---

**Status:** 🚧 Em desenvolvimento ativo - Server completo | Client pendente
