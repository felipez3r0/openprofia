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
- **Segurança:** Autenticação via JWT (para modo servidor universitário)

## 3. Arquitetura de Sistema

O projeto é dividido em dois pacotes principais (Monorepo ou pastas separadas):

### A. Client (App Desktop)

- Interface de chat limpa e minimalista.
- Seletor de provedor: "Local" (conecta ao localhost:3000) ou "Remoto" (conecta à URL da Universidade).
- Gerenciador de Skills: Interface para upload de arquivos .zip.

### B. Server (Orquestrador)

- API Gateway: Endpoints para chat, gestão de skills e upload de arquivos.
- Skill Engine: Interpretador de manifestos declarativos (JSON + Markdown).
- Background Worker: Processamento assíncrono de documentos (PDF/Docx) usando SQLite como fila para evitar bloqueio de I/O.
- RAG Layer: Extração de texto e indexação vetorial automática no LanceDB.

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

## 6. Estrutura de Pastas Sugerida

```
/root
  /apps
    /client (Tauri + React)
    /server (Fastify + TS)
  /packages
    /core (Interfaces e Tipos Compartilhados)
    /skills (Diretório onde os .zips serão extraídos)
    /storage (SQLite e LanceDB)
```
