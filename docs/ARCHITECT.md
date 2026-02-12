# Documentação Técnica: Projeto OpenProfIA

## 1. Visão Geral

Plataforma de IA Open Source local-first para educação. O sistema permite que professores preparem aulas e materiais usando LLMs locais, com foco em hardware de baixo custo (CPU/RAM comum) e extensibilidade via "Skills" comunitárias.

## 2. Pilha Tecnológica (Tech Stack)

- **Desktop Shell:** Tauri (Rust + Webview nativo)
- **Frontend:** React + TypeScript + Tailwind CSS + Shadcn/UI
- **Backend (Server):** Node.js com Fastify (TypeScript)
- **Banco de Dados & Fila:** SQLite (via better-sqlite3)
- **Busca Semântica (RAG):** LanceDB (vetores baseados em arquivos)
- **Motor de Inferência:** Ollama API (Modelos: Phi-3, Gemma 2)
- **Segurança:** Sistema preparado para JWT mas não implementado (planejado para modo multi-usuário universitário)

## 3. Arquitetura de Sistema

O projeto é dividido em dois pacotes principais (Monorepo ou pastas separadas):

### A. Client (App Desktop)

- Interface de chat limpa e minimalista.
- Seletor de provedor com 3 modos:
  - **Local:** Servidor externo em localhost:3000
  - **Embedded:** Sidecar gerenciado automaticamente pelo Tauri (padrão)
  - **Remoto:** URL customizada (ex: servidor universitário)
- Gerenciador de Skills: Interface para upload de arquivos .zip.
- Configuração persistida em localStorage com sistema de migração entre versões.

### B. Server (Orquestrador)

- API Gateway: Endpoints para chat, gestão de skills, upload de arquivos e settings.
- Skill Engine: Interpretador de manifestos declarativos (JSON + Markdown).
- Background Worker: Processamento assíncrono de documentos (PDF/TXT) usando SQLite como fila para evitar bloqueio de I/O.
- RAG Layer: Extração de texto e indexação vetorial automática no LanceDB.
- Settings API: Configuração dinâmica de modelos Ollama e download de modelos via streaming.

## 4. Padrão de Skills (Inspirado em Agents.md)

Cada habilidade é um pacote .zip contendo:

- manifest.json: Metadados (nome, versão, capacidades).
- prompt.md: O System Prompt que define a personalidade e o conhecimento da IA.
- knowledge/: Pasta opcional com arquivos base para o RAG.

**Regra de Segurança:** Nenhuma Skill pode executar código binário ou scripts .js diretamente. Elas apenas consomem ferramentas (Tools) pré-implementadas no Core do Server.

## 5. Fluxo de Dados de Processamento (RAG)

1. O usuário envia um PDF.
2. O Server recebe, gera um job_id e salva no SQLite.
3. O Worker em background:
   - Extrai o texto.
   - Gera chunks (pedaços de texto).
   - Faz o embedding via Ollama.
   - Salva no LanceDB vinculando à Skill ativa.
4. O Chat usa os 3-5 resultados mais relevantes como contexto para a resposta da LLM.

## 6. Deployment & Build

### Modo Desktop (Tauri Sidecar)

- **Build:** Script `build-sidecar.mjs` empacota o servidor com esbuild
- **Bundling:** Server.js + dependências nativas (better-sqlite3, vectordb) + migrations + skills built-in
- **Wrapper:** Scripts bash para macOS (aarch64 e x86_64) que localizam Node.js no sistema
- **Limitações atuais:**
  - Requer Node.js 22+ instalado no sistema do usuário
  - Não é standalone (planejado: runtime embarcado via pkg/nexe)
  - Wrappers apenas para macOS (Windows/Linux planejados)
  - Dependências nativas instaladas via npm no momento do build

### Modo Servidor Standalone

- **Deployment:** Executar `apps/server` diretamente com Node.js
- **Autenticação:** JWT configurado mas não implementado (sem endpoints de login/registro)
- **Escalabilidade:** Preparado para ambiente universitário mas requer implementação de autenticação multi-usuário

## 7. Estrutura de Pastas

```
/root
  /apps
    /client (Tauri + React)
      /src (código React)
      /src-tauri (configuração e código Rust)
        /binaries (sidecar: wrappers + server-bundle)
    /server (Fastify + TS)
      /src (código-fonte do servidor)
  /packages
    /core (Interfaces e Tipos Compartilhados)
    /skills (Skills instaladas - .zips extraídos)
    /storage
      /uploads (documentos enviados)
      /vectors (LanceDB - tabelas por skill)
  /scripts
    build-sidecar.mjs (build do servidor para sidecar)
```
