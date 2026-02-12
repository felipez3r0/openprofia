# OpenProfIA

Plataforma de IA Open Source local-first para educação.

## 📚 Visão Geral

OpenProfIA democratiza o acesso à IA para professores através de uma plataforma que roda em hardware doméstico (sem necessidade de GPU dedicada), usando LLMs locais via Ollama e sistema de extensibilidade baseado em "Skills" comunitárias.

## 🏗️ Arquitetura

Monorepo composto por:

- **`apps/server`** - API Fastify + RAG + Worker de background
- **`apps/client`** - Desktop app (Tauri v2 + React + Tailwind + Shadcn/UI)
- **`packages/core`** - Tipos e interfaces compartilhadas (TypeScript)
- **`packages/storage`** - Dados persistentes (SQLite + LanceDB)
- **`packages/skills`** - Skills instaladas (pacotes .zip declarativos)

## 🚀 Quick Start

### Pré-requisitos

- Node.js >= 22 LTS
- pnpm >= 9
- Ollama instalado e rodando (`http://localhost:11434`)
- Rust toolchain (para build do Client Tauri) — [rustup.rs](https://rustup.rs)

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd openprofia

# Instala dependências
pnpm install

# Copia .env de exemplo
cp .env.example .env

# Inicia server + client em modo dev
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

## ✨ Destaques da Implementação

Além das funcionalidades documentadas, o projeto inclui:

- **Health check detalhado** - Monitora status de Ollama, SQLite e LanceDB em tempo real
- **Download streaming de modelos** - Instale modelos Ollama diretamente pela UI com progresso em tempo real
- **Migração automática de configurações** - Sistema de versioning no localStorage para compatibilidade entre atualizações
- **Graceful shutdown** - Worker aguarda job corrente finalizar antes de parar o servidor
- **Sistema de seeds** - Skills built-in são automaticamente registradas no primeiro boot
- **Threshold de similaridade configurável** - RAG usa score mínimo de 0.3 para relevância de contexto
- **Validação de segurança** - Upload de skills bloqueia arquivos executáveis (.js, .sh, .bin, .exe, etc.)

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
- `pnpm --filter @openprofia/client dev` - Roda apenas o client (Vite dev server na porta 1420)
- `pnpm --filter @openprofia/client tauri dev` - Roda o client dentro da janela Tauri nativa
- `pnpm --filter @openprofia/core build` - Compila apenas o core
- `turbo dev` - Roda todos os workspaces em modo dev

## �️ Client Desktop

O client é uma aplicação desktop construída com **Tauri v2** (Rust + Webview nativo) e **React 19**.

### Tech Stack

- **Shell:** Tauri v2 (janela nativa, titlebar customizada)
- **UI:** React 19 + TypeScript + Tailwind CSS + Shadcn/UI (tema New York)
- **Routing:** @tanstack/react-router (type-safe)
- **Estado:** Zustand (stores para conexão, skills, chat)
- **Chat:** Streaming SSE via fetch + ReadableStream

### Páginas

| Rota         | Descrição                                                |
| ------------ | -------------------------------------------------------- |
| `/chat`      | Interface de chat com IA (streaming, markdown)           |
| `/skills`    | Gerenciamento de skills (upload .zip, listagem, remoção) |
| `/documents` | Upload de PDFs + acompanhamento de processamento         |
| `/settings`  | Seletor de provedor (Local/Remoto) + teste de conexão    |

### Provider Pattern

O client é backend-agnostic via `ConnectionProvider` com **3 modos** de operação:

- **Modo Local:** Conecta a servidor externo em `http://localhost:3000`
- **Modo Embedded:** Sidecar gerenciado automaticamente pelo Tauri (padrão no desktop)
- **Modo Remoto:** URL configurável (ex: servidor universitário)
- Configuração persistida em `localStorage` com migração automática entre versões

## �🔌 API Endpoints

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

## ⚠️ Limitações Atuais

### Formatos de Documento

- ✅ PDF e TXT/MD totalmente suportados
- ❌ DOCX planejado mas não implementado

### Chunking e Embedding

- Estratégia de chunking simplificada baseada em caracteres
- Para produção, recomenda-se usar tokenizer real (tiktoken) para melhor precisão

### Sidecar (Desktop App)

- Build atual requer Node.js 22+ instalado no sistema
- Não é 100% standalone (planejado: runtime embarcado via pkg/nexe)
- Wrappers shell apenas para macOS (Windows/Linux planejados)

### Autenticação

- Sistema preparado para JWT mas não implementado
- Login/registro não disponível
- Planejado para modo multi-usuário (servidor universitário)

## 🌐 Variáveis de Ambiente

Ver `.env.example` para lista completa. Principais:

```env
# Server
PORT=3000
NODE_ENV=development
SIDECAR_MODE=0  # 1 desabilita Swagger (modo embedded)

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=gemma2:2b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# JWT (planejado para modo universitário)
JWT_SECRET=your-secret-key-here

# Paths
STORAGE_PATH=./packages/storage
SKILLS_PATH=./packages/skills

# Worker
WORKER_POLL_INTERVAL_MS=5000
MAX_CONCURRENT_JOBS=1

# RAG
CHUNK_SIZE=500
CHUNK_OVERLAP=50
MAX_CONTEXT_CHUNKS=5

# Upload
MAX_FILE_SIZE_MB=50
```

> **Nota:** Configurações de Ollama e paths podem ser alteradas em runtime via Settings API.

## 📝 Licença

MIT

## 🤝 Contribuindo

Contribuições são muito bem-vindas! OpenProfIA é um projeto comunitário e toda ajuda conta — seja código, documentação, skills ou feedback.

### Como começar

1. **Fork** o repositório e clone localmente
2. Instale as dependências: `pnpm install`
3. Crie uma branch a partir de `main`: `git checkout -b feat/minha-contribuicao`
4. Faça suas alterações seguindo os padrões abaixo
5. Rode o typecheck: `pnpm typecheck`
6. Commit com mensagens claras (veja convenção abaixo)
7. Abra um **Pull Request** descrevendo o que foi feito e por quê

### Convenção de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona endpoint de listagem de modelos
fix: corrige timeout na conexão com Ollama
docs: atualiza seção de Quick Start no README
refactor: extrai lógica de chunking para módulo separado
chore: atualiza dependências do workspace
```

### Padrões de Código

- **TypeScript estrito** — evite `any` a todo custo
- Prefira `interface` sobre `type` para definições de API e modelos de dados
- Tipos compartilhados ficam em `packages/core`
- Backend segue o padrão de **Plugins do Fastify** com validação via JSON Schema
- Frontend usa **Componentes Funcionais + Hooks**, estilizados com **Tailwind CSS** e **Shadcn/UI**
- Consulte o [AGENTS.md](AGENTS.md) para referência completa dos padrões

### Tipos de Contribuição

| Tipo       | Descrição                                                       |
| ---------- | --------------------------------------------------------------- |
| 🐛 Bug fix | Correção de erros — abra uma issue antes, se possível           |
| ✨ Feature | Funcionalidade nova — discuta em uma issue antes de implementar |
| 📖 Docs    | Melhorias na documentação, exemplos e tutoriais                 |
| 🧩 Skills  | Criação de novas skills comunitárias (veja abaixo)              |
| 🧪 Testes  | Aumento de cobertura de testes                                  |
| 🌐 i18n    | Traduções e internacionalização                                 |

### Criando Skills

Skills são a forma mais acessível de contribuir, mesmo sem experiência em programação. Uma skill é um pacote `.zip` **puramente declarativo** contendo:

- `manifest.json` — metadados e configurações
- `prompt.md` — prompt de sistema para a IA
- `knowledge/` — documentos de referência (PDFs, TXT)

> ⚠️ **Regra de segurança:** Skills **não podem** conter código executável (`.js`, `.sh`, `.bin`, `.exe`). Consulte a seção [Sistema de Skills](#-sistema-de-skills) para detalhes.

### Reportando Bugs

Ao abrir uma issue de bug, inclua:

- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs. observado
- Sistema operacional e versão do Node.js
- Modelo Ollama em uso (se relevante)

### Ambiente de Desenvolvimento

```bash
# Pré-requisitos
node --version   # >= 22 LTS
pnpm --version   # >= 9
ollama --version  # Ollama rodando em localhost:11434

# Desenvolvimento
pnpm dev          # Inicia server + client em watch mode
pnpm typecheck    # Verifica tipos em todo o monorepo
```

### Princípios do Projeto

Ao contribuir, tenha em mente:

- **Local-first** — tudo deve funcionar offline, em hardware doméstico, sem GPU dedicada
- **Minimalismo** — evite dependências pesadas que aumentem o bundle do Tauri
- **Eficiência** — processamento de documentos deve ser chunked para evitar picos de CPU/RAM
- **Segurança** — skills são sandboxed e declarativas por design

---

**Status:** 🚧 Em desenvolvimento ativo - Core funcional | Limitações: autenticação multi-usuário, sidecar standalone, suporte DOCX
