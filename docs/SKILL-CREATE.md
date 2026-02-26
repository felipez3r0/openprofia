# Guia de Criação de Skills para OpenProfIA

## 1. Introdução

Este documento é um guia técnico para **agentes de IA** que precisam criar novas Skills para o projeto OpenProfIA. Skills são pacotes declarativos (arquivos `.zip`) que estendem as capacidades da plataforma de forma segura e modular.

### Filosofia das Skills

- **Declarativas:** Nenhum código executável é permitido. Skills contêm apenas configuração (JSON) e conteúdo (Markdown/texto)
- **Sandboxed:** Segurança garantida através da proibição de scripts `.js`, `.sh`, `.bin`, `.exe`, `.bat`, `.cmd`, `.py`, `.rb`
- **Local-first:** Otimizadas para rodar em hardware doméstico com modelos LLM locais via Ollama
- **Contexto Educacional:** Focadas em auxiliar professores do Ensino Básico brasileiro (K-12)

### Referências Técnicas

- **Arquitetura Completa:** [ARCHITECT.md](./ARCHITECT.md)
- **Guidelines Gerais:** [../AGENTS.md](../AGENTS.md)
- **Interfaces TypeScript:** `packages/core/src/interfaces/skill.ts`
- **Skill de Referência:** `packages/skills/gerador-questoes/`

---

## 2. Anatomia de uma Skill

Uma Skill é um pacote `.zip` com a seguinte estrutura:

```
minha-skill.zip
├── manifest.json          # Obrigatório: Metadados e configuração
├── prompt.md              # Obrigatório: System prompt da IA
└── knowledge/             # Opcional: Documentos base para RAG
    ├── documento1.pdf
    ├── documento2.txt
    └── referencia.md
```

### 2.1. manifest.json (Obrigatório)

Arquivo JSON que define os metadados e comportamento da Skill.

#### Campos Obrigatórios

```json
{
  "id": "minha-skill",
  "name": "Minha Skill Exemplo",
  "version": "1.0.0",
  "description": "Descrição clara e concisa do que a Skill faz",
  "capabilities": ["tag1", "tag2"]
}
```

- **`id`** (string, obrigatório)
  - Identificador único da Skill
  - Regex: `^[a-zA-Z0-9_-]+$` (apenas letras, números, hífens e underscores)
  - Minúsculas recomendadas
  - Exemplo: `"gerador-questoes"`, `"plano-aula"`, `"correcao-redacao"`

- **`name`** (string, obrigatório)
  - Nome amigável exibido na interface
  - Exemplo: `"Gerador de Questões"`

- **`version`** (string, obrigatório)
  - Versão da Skill (Semver recomendado)
  - Exemplo: `"1.0.0"`, `"2.1.3"`

- **`description`** (string, obrigatório)
  - Descrição concisa (1-2 frases) do propósito da Skill
  - Exibida no card da interface

- **`capabilities`** (array de strings, obrigatório)
  - Tags que descrevem as capacidades da Skill
  - Usadas para busca e categorização
  - Exemplos: `["assessment", "multiple-choice", "quiz"]`, `["lesson-plan", "bncc"]`, `["content-creation", "text-generation"]`

#### Campos Opcionais

```json
{
  "author": "Nome do Criador",
  "tools": [],
  "modelPreferences": {
    "chat": "gemma3:4b",
    "embedding": "nomic-embed-text"
  },
  "fewShotMessages": [
    {
      "role": "user",
      "content": "Exemplo de pergunta do professor"
    },
    {
      "role": "assistant",
      "content": "Exemplo de resposta ideal da IA"
    }
  ]
}
```

- **`author`** (string, opcional)
  - Nome do criador da Skill
  - Exibido no card da interface

- **`tools`** (array de strings, opcional)
  - **Status:** Planejado para futuras versões, ainda não implementado
  - Permitirá declarar ferramentas externas que a Skill pode usar
  - Por enquanto, mantenha como array vazio `[]`

- **`modelPreferences`** (objeto, opcional)
  - Define modelos Ollama preferenciais para esta Skill
  - `chat`: Modelo usado para geração de respostas (padrão: configuração global)
  - `embedding`: Modelo usado para embeddings RAG (padrão: `"nomic-embed-text"`)
  - Modelos recomendados:
    - Chat rápido: `"gemma3:4b"`, `"phi3:mini"`
    - Chat qualidade: `"llama3:8b"`, `"gemma2:9b"`
    - Embedding: `"nomic-embed-text"` (padrão), `"mxbai-embed-large"`

- **`fewShotMessages`** (array de objetos, opcional)
  - Exemplos de interações para in-context learning
  - Melhora a qualidade das respostas fornecendo padrões
  - Formato: `{ role: "user" | "assistant", content: string }`
  - Máximo recomendado: 3-5 pares de exemplos (evitar contexto muito longo)

#### Exemplo Completo: manifest.json

```json
{
  "id": "gerador-questoes",
  "name": "Gerador de Questões",
  "version": "1.0.0",
  "description": "Gera questões de múltipla escolha para provas e avaliações escolares, com gabarito e justificativa pedagógica.",
  "author": "OpenProfIA",
  "capabilities": ["assessment", "multiple-choice", "quiz"],
  "tools": [],
  "modelPreferences": {
    "chat": "gemma3:4b",
    "embedding": "nomic-embed-text"
  },
  "fewShotMessages": [
    {
      "role": "user",
      "content": "Preciso de 2 questões de Matemática sobre frações para o 6º ano, nível fácil."
    },
    {
      "role": "assistant",
      "content": "---\n\n**Questão 1:**\nQual fração representa a parte colorida do círculo abaixo, se ele está dividido em 4 partes iguais e 3 estão coloridas?\n\nA) 1/4\nB) 3/4\nC) 4/3\nD) 2/4\n\n**Resposta correta:** B\n\n**Justificativa:** Das 4 partes totais, 3 estão coloridas, portanto 3/4. A alternativa A representa apenas 1 parte. C inverte numerador e denominador. D simplifica para 1/2.\n\n---"
    }
  ]
}
```

### 2.2. prompt.md (Obrigatório)

Arquivo Markdown contendo o **system prompt** que define a personalidade, conhecimento e comportamento da IA quando esta Skill está ativa.

#### Estrutura Recomendada

```markdown
# [Nome da Skill]

[Abertura definindo quem a IA é e qual seu papel]

## Comportamento

[Instruções passo a passo de como a IA deve agir]

## Formato de Saída

[Especificação clara do formato esperado nas respostas]

## Diretrizes [Pedagógicas/Técnicas]

[Regras específicas do domínio (ex: alinhamento BNCC, linguagem adequada)]

## Contexto Adicional

[Como usar documentos RAG se disponíveis]
```

#### Princípios de um Bom System Prompt

1. **Clareza de Papel:** Defina quem a IA é (ex: "Você é um especialista em avaliação educacional...")
2. **Instruções Passo a Passo:** Use listas numeradas para sequências de ação
3. **Formato Explícito:** Mostre exemplos visuais do output esperado
4. **Contexto Educacional:** Adapte linguagem à faixa etária, alinhe com BNCC quando aplicável
5. **RAG-Aware:** Instrua sobre como usar documentos fornecidos pelo professor
6. **Tom Profissional:** Mantenha educado, prestativo, sem jargões desnecessários

### 2.3. knowledge/ (Opcional)

Pasta contendo documentos base para o sistema RAG (Retrieval-Augmented Generation).

#### Quando Usar

- Skill precisa de conhecimento específico que não está no treinamento do LLM
- Referências oficiais (ex: BNCC, diretrizes curriculares)
- Exemplos didáticos (ex: banco de questões modelo)
- Materiais de referência do próprio professor (via upload posterior)

#### Formatos Suportados

- **PDF** (`.pdf`) - Extração via pdf-parse
- **Texto** (`.txt`) - Leitura direta
- **Markdown** (`.md`) - Leitura direta

#### Organização

```
knowledge/
├── bncc-ensino-fundamental.pdf
├── exemplos-questoes.md
└── taxonomia-bloom.txt
```

**Limite de Tamanho:** 50 MB por documento individual

---

## 3. Regras de Validação e Segurança

### 3.1. Validação de ID

- **Regex:** `^[a-zA-Z0-9_-]+$`
- **Proibido:** Espaços, caracteres especiais (`@`, `#`, `$`, `/`, `\`, etc.)
- **Recomendado:** Kebab-case minúsculo (ex: `plano-de-aula`, `correcao-redacao`)
- **Unicidade:** ID já instalado gera erro `ConflictError`

### 3.2. Segurança: Proibição de Executáveis

Por medidas de segurança, os seguintes tipos de arquivo são **bloqueados**:

```
.js   .mjs  .cjs        # JavaScript
.sh   .bash .zsh        # Shell scripts
.bin  .exe  .dll        # Binários
.bat  .cmd  .ps1        # Scripts Windows
.py   .pyc              # Python
.rb                     # Ruby
.so   .dylib            # Bibliotecas nativas
```

**Motivo:** Skills são puramente declarativas. Toda lógica executável deve estar no core do servidor.

**Consequência:** Upload de Skill com executáveis resulta em erro `400 Bad Request` com mensagem "Arquivos executáveis não são permitidos em Skills".

### 3.3. Estrutura do ZIP

#### Opção 1: Flat (arquivos na raiz)

```
minha-skill.zip
├── manifest.json
├── prompt.md
└── knowledge/
    └── doc.pdf
```

#### Opção 2: Com Pasta Raiz Única (auto-detectado)

```
minha-skill.zip
└── minha-skill/
    ├── manifest.json
    ├── prompt.md
    └── knowledge/
        └── doc.pdf
```

O servidor detecta automaticamente e normaliza ambas estruturas.

### 3.4. Campos Obrigatórios vs Opcionais

| Campo              | Status          | Validação                                |
| ------------------ | --------------- | ---------------------------------------- |
| `id`               | **Obrigatório** | String não-vazia, regex `[a-zA-Z0-9_-]+` |
| `name`             | **Obrigatório** | String não-vazia                         |
| `version`          | **Obrigatório** | String não-vazia                         |
| `description`      | **Obrigatório** | String não-vazia                         |
| `capabilities`     | **Obrigatório** | Array com pelo menos 1 item              |
| `author`           | Opcional        | String                                   |
| `tools`            | Opcional        | Array de strings                         |
| `modelPreferences` | Opcional        | Objeto `{ chat?, embedding? }`           |
| `fewShotMessages`  | Opcional        | Array de `{ role, content }`             |

---

## 4. Exemplos Práticos

### 4.1. Skill Simples: Corretor Ortográfico

**Caso de Uso:** Revisar textos de alunos identificando erros de ortografia.

**manifest.json:**

```json
{
  "id": "corretor-ortografia",
  "name": "Corretor Ortográfico",
  "version": "1.0.0",
  "description": "Identifica e corrige erros ortográficos em textos de alunos, com explicações pedagógicas.",
  "author": "Comunidade OpenProfIA",
  "capabilities": ["spelling", "grammar", "correction"],
  "modelPreferences": {
    "chat": "gemma3:4b"
  }
}
```

**prompt.md:**

```markdown
# Corretor Ortográfico Pedagógico

Você é um assistente especializado em língua portuguesa para professores do Ensino Básico.

## Comportamento

Quando o professor enviar um texto de aluno:

1. Identifique **erros ortográficos** (grafia incorreta de palavras)
2. Liste cada erro encontrado
3. Forneça a **correção** e uma **explicação simples** (regra ortográfica aplicável)

## Formato de Saída

**Erros encontrados:**

1. ~~erro~~ → **correção** — _Explicação da regra_
2. ~~outro erro~~ → **correção** — _Explicação_

**Texto corrigido:**  
[Texto completo com correções aplicadas]

## Diretrizes

- Foque apenas em ortografia (não gramática ou estilo)
- Use linguagem acessível para professores
- Se não houver erros, parabenize: "Nenhum erro ortográfico encontrado! ✓"
```

### 4.2. Skill Avançada: Planejador de Aulas BNCC

**Caso de Uso:** Gerar planos de aula alinhados com competências da BNCC.

**manifest.json:**

```json
{
  "id": "plano-aula-bncc",
  "name": "Planejador de Aulas BNCC",
  "version": "2.0.0",
  "description": "Cria planos de aula detalhados alinhados com a Base Nacional Comum Curricular (BNCC).",
  "author": "OpenProfIA Core Team",
  "capabilities": ["lesson-plan", "bncc", "curriculum", "pedagogy"],
  "tools": [],
  "modelPreferences": {
    "chat": "gemma2:9b",
    "embedding": "nomic-embed-text"
  },
  "fewShotMessages": [
    {
      "role": "user",
      "content": "Preciso de um plano de aula de Ciências sobre fotossíntese para o 5º ano."
    },
    {
      "role": "assistant",
      "content": "# Plano de Aula: Fotossíntese\n\n**Ano/Série:** 5º ano do Ensino Fundamental\n**Disciplina:** Ciências\n**Duração:** 2 aulas de 50 minutos\n\n## Habilidade BNCC\n**EF05CI05** - Construir propostas coletivas para um consumo mais consciente...\n\n## Objetivos\n- Compreender o processo de fotossíntese\n- Identificar elementos necessários (luz, água, CO₂)\n\n## Metodologia\n1. **Introdução (15min):** Discussão sobre como as plantas se alimentam...\n[continua com desenvolvimento e avaliação]"
    }
  ]
}
```

**prompt.md:**

```markdown
# Planejador de Aulas Alinhado à BNCC

Você é um especialista em planejamento pedagógico para o Ensino Básico brasileiro.

## Comportamento

Ao receber uma solicitação de plano de aula:

1. **Colete informações** (se não fornecidas):
   - Disciplina
   - Ano/Série
   - Tema/Conteúdo
   - Duração prevista

2. **Consulte documentos RAG** se disponíveis (ex: BNCC completa no knowledge/)

3. **Gere o plano** seguindo a estrutura abaixo

## Formato de Saída

# Plano de Aula: [Tema]

**Ano/Série:** [Ex: 7º ano do Fundamental]  
**Disciplina:** [Ex: História]  
**Duração:** [Ex: 2 aulas de 50 minutos]

## Habilidade(s) BNCC

**[Código]** - [Descrição da habilidade]

## Objetivos de Aprendizagem

- [Objetivo 1]
- [Objetivo 2]
- [Objetivo 3]

## Recursos Necessários

- [Recurso 1]
- [Recurso 2]

## Metodologia

### 1. Introdução ([tempo])

[Descrição da atividade]

### 2. Desenvolvimento ([tempo])

[Descrição da atividade]

### 3. Fechamento ([tempo])

[Descrição da atividade]

## Avaliação

[Como avaliar se os objetivos foram alcançados]

## Observações/Adaptações

[Sugestões para diferentes contextos ou necessidades especiais]

## Diretrizes Pedagógicas

- **Sempre referencie** pelo menos uma habilidade BNCC com código (ex: EF67HI03)
- Use **metodologias ativas** quando apropriado (aprendizagem baseada em problemas, sala invertida)
- Adapte a **linguagem** ao ano/série dos alunos
- Sugira **recursos acessíveis** (evite equipamentos caros)
- Inclua **avaliação formativa**, não apenas somativa
- Se houver documentos da BNCC no knowledge/, use-os para garantir precisão nos códigos

## Contexto Adicional

Se o professor enviar PDFs com a BNCC completa ou materiais complementares, use-os como referência autoritativa para os códigos de habilidades e competências.
```

**knowledge/** (exemplo):

```
knowledge/
├── bncc-ensino-fundamental-completo.pdf
└── metodologias-ativas-guia.md
```

### 4.3. Skill de Análise: Análise de Dados Escolares

**Caso de Uso:** Interpretar planilhas de notas e gerar insights pedagógicos.

**manifest.json:**

```json
{
  "id": "analise-dados-escolares",
  "name": "Análise de Dados Escolares",
  "version": "1.0.0",
  "description": "Analisa dados de desempenho de alunos (notas, frequência) e gera insights pedagógicos.",
  "capabilities": ["data-analysis", "assessment", "statistics"],
  "modelPreferences": {
    "chat": "llama3:8b"
  }
}
```

**prompt.md:**

```markdown
# Analista de Dados Escolares

Você é um especialista em análise de dados educacionais e avaliação formativa.

## Comportamento

Quando o professor compartilhar dados (notas, frequência, etc.):

1. **Identifique padrões** (médias, desvios, tendências)
2. **Destaque alunos** que precisam atenção (abaixo da média, faltas frequentes)
3. **Sugira intervenções** pedagógicas baseadas em evidências

## Formato de Saída

## Resumo Estatístico

- Média da turma: [valor]
- Mediana: [valor]
- Desvio padrão: [valor]

## Alunos em Destaque

**Necessitam atenção:**

- [Aluno X]: [Motivo] → Sugestão: [intervenção]

**Destaque positivo:**

- [Aluno Y]: [Motivo]

## Insights Pedagógicos

[Análise qualitativa dos padrões observados]

## Diretrizes

- Use linguagem não-técnica (evite jargão estatístico excessivo)
- Foque em **ações práticas** que o professor pode tomar
- Preserve **anonimato** se solicitado
- Evite julgamentos; use tom de **suporte pedagógico**
```

---

## 5. Checklist de Validação Pré-Instalação

Use esta lista para verificar sua Skill antes do upload:

### ✅ Estrutura de Arquivos

- [ ] Arquivo `manifest.json` presente na raiz do ZIP
- [ ] Arquivo `prompt.md` presente na raiz do ZIP
- [ ] Se houver `knowledge/`, está como pasta (não arquivo)
- [ ] Nenhum arquivo executável (`.js`, `.sh`, `.bin`, `.exe`, `.bat`, `.cmd`, `.py`, `.rb`)

### ✅ manifest.json

- [ ] Campo `id` presente e segue regex `^[a-zA-Z0-9_-]+$`
- [ ] Campo `name` presente e descritivo
- [ ] Campo `version` presente (Semver recomendado)
- [ ] Campo `description` presente e claro (1-2 frases)
- [ ] Campo `capabilities` presente com pelo menos 1 tag
- [ ] Se `modelPreferences.chat` definido, modelo existe no Ollama
- [ ] Se `fewShotMessages` definido, formato correto: `[{ role, content }]`
- [ ] JSON válido (sem erros de sintaxe)

### ✅ prompt.md

- [ ] Define claramente o papel da IA
- [ ] Inclui instruções de comportamento passo a passo
- [ ] Especifica formato de saída esperado
- [ ] Menciona como usar documentos RAG (se aplicável)
- [ ] Linguagem adequada ao contexto educacional brasileiro
- [ ] Sem instruções conflitantes ou ambíguas

### ✅ knowledge/ (se aplicável)

- [ ] Apenas arquivos `.pdf`, `.txt`, `.md`
- [ ] Cada arquivo ≤ 50 MB
- [ ] Conteúdo relevante para o domínio da Skill
- [ ] Nomes de arquivo descritivos (sem caracteres especiais)

### ✅ Alinhamento com Projeto

- [ ] Skill serve um propósito educacional claro
- [ ] Não duplica funcionalidade de Skill existente
- [ ] Segue filosofia declarativa (sem executáveis)
- [ ] Otimizada para hardware modesto (modelo LLM leve se possível)

---

## 6. Fluxo de Desenvolvimento

### Passo 1: Definir Objetivo Pedagógico

Responda:

- Qual problema do professor esta Skill resolve?
- Para qual contexto educacional (disciplina, ano/série)?
- Qual output ela deve gerar?

**Exemplo:** _"Professores de Matemática do 6º-9º ano precisam criar listas de exercícios rapidamente. A Skill deve gerar 10 questões variadas sobre um tema, com resolução passo a passo."_

### Passo 2: Escrever manifest.json

Comece simples:

```json
{
  "id": "gerador-exercicios-mat",
  "name": "Gerador de Exercícios de Matemática",
  "version": "1.0.0",
  "description": "Gera listas de exercícios matemáticos com resolução comentada.",
  "capabilities": ["math", "exercises", "problem-solving"]
}
```

Adicione campos opcionais conforme necessário:

- `modelPreferences` se precisa de modelo específico
- `fewShotMessages` se precisa de exemplos para guiar formato
- `author` para crédito

### Passo 3: Craftar prompt.md

Siga a estrutura recomendada (seção 2.2):

1. **Abertura:** Defina o papel ("Você é especialista em...")
2. **Comportamento:** Liste passos que a IA deve seguir
3. **Formato de Saída:** Mostre template visual
4. **Diretrizes:** Regras específicas do domínio

**Iteração:** Teste mentalmente cenários edge-case e refine.

### Passo 4: (Opcional) Adicionar knowledge/

Se a Skill precisa de conhecimento específico:

1. Crie pasta `knowledge/`
2. Adicione PDFs, TXTs ou MDs relevantes
3. Referencie no `prompt.md`: _"Se houver documentos fornecidos, use-os como referência..."_

### Passo 5: Empacotar em ZIP

```bash
# Via linha de comando (macOS/Linux)
cd caminho/para/minha-skill
zip -r minha-skill.zip manifest.json prompt.md knowledge/

# Via interface gráfica
# Selecione os arquivos → Botão direito → Comprimir
```

**Importante:** Certifique-se de que `manifest.json` esteja na raiz do ZIP, não dentro de subpastas desnecessárias.

### Passo 6: Validar Estrutura

Descompacte o ZIP e verifique:

```
minha-skill/
├── manifest.json    ✓
├── prompt.md        ✓
└── knowledge/       ✓ (opcional)
```

Execute o checklist da seção 5.

### Passo 7: Upload via Interface

1. Abra OpenProfIA
2. Navegue até **Skills** (menu lateral)
3. Clique em **Upload de Skill** (área drag-and-drop)
4. Selecione o arquivo `.zip`
5. Aguarde validação:
   - ✅ Sucesso: Skill aparece na lista
   - ⚠️ Modelos faltantes: Diálogo oferece instalação via Ollama
   - ❌ Erro: Leia a mensagem e corrija (veja seção 8: Troubleshooting)

### Passo 8: Testar no Chat

1. Selecione a Skill no seletor (sidebar)
2. Envie mensagem de teste representativa do caso de uso
3. Verifique se o output segue o formato esperado
4. Itera refinando o `prompt.md` se necessário (re-upload com mesma `id` sobrescreve)

---

## 7. Melhores Práticas

### 7.1. Linguagem e Tom

- **Português brasileiro:** Use ortografia e termos locais (ex: "professores", não "maestros")
- **Tom profissional:** Educado, prestativo, sem excessiva casualidade
- **Evite jargões:** A menos que seja específico do domínio educacional

### 7.2. Alinhamento com BNCC

Para Skills pedagógicas:

- Referencie **códigos de habilidades** quando aplicável (ex: EF67HI03)
- Use **competências gerais** como guia de objetivos
- Inclua PDF da BNCC em `knowledge/` se a Skill depende muito dela

**Recurso:** [Base Nacional Comum Curricular](http://basenacionalcomum.mec.gov.br/)

### 7.3. Clareza nas Instruções

- **Sequencial:** Use listas numeradas para processos
- **Exemplos visuais:** Mostre o formato de saída esperado diretamente no prompt
- **Edge cases:** Antecipe situações atípicas ("Se não houver informações suficientes, pergunte...")

### 7.4. Uso Eficiente de fewShotMessages

- **Quantidade:** 1-3 pares de exemplos (user + assistant) são suficientes
- **Diversidade:** Mostre casos diferentes (ex: fácil, médio, difícil)
- **Comprimento:** Mantenha exemplos concisos (evitar contexto muito longo que prejudica performance)

### 7.5. Trade-offs de Modelos LLM

| Modelo      | Tamanho | Velocidade    | Qualidade      | Caso de Uso                        |
| ----------- | ------- | ------------- | -------------- | ---------------------------------- |
| `phi3:mini` | ~2 GB   | ⚡⚡⚡ Rápido | ⭐⭐ OK        | Tarefas simples, respostas curtas  |
| `gemma3:4b` | ~4 GB   | ⚡⚡ Moderado | ⭐⭐⭐ Boa     | Uso geral balanceado (recomendado) |
| `llama3:8b` | ~8 GB   | ⚡ Lento      | ⭐⭐⭐⭐ Ótima | Análise complexa, raciocínio       |
| `gemma2:9b` | ~9 GB   | ⚡ Lento      | ⭐⭐⭐⭐ Ótima | Geração de conteúdo longo          |

**Recomendação:** Use `gemma3:4b` como padrão. Especifique modelos maiores apenas se a tarefa exigir qualidade superior (ex: planejamento de aulas detalhado, correção de redações).

### 7.6. Otimização para Hardware Modesto

Lembre-se: OpenProfIA roda em **hardware doméstico sem GPU dedicada**.

- Prefira modelos ≤ 8 GB
- Evite `fewShotMessages` muito longos (aumenta contexto → RAM)
- Se a Skill precisar de modelo pesado, documente nos requisitos

---

## 8. Troubleshooting

### Problema: "manifest.json não encontrado"

**Causa:** Estrutura do ZIP incorreta.

**Solução:**

1. Descompacte o ZIP
2. Verifique se `manifest.json` está na raiz (não em subpasta dupla)
3. Estrutura esperada:

   ```
   skill.zip
   ├── manifest.json  ✓
   └── prompt.md

   OU

   skill.zip
   └── skill/
       ├── manifest.json  ✓
       └── prompt.md
   ```

### Problema: "Arquivos executáveis não são permitidos em Skills"

**Causa:** ZIP contém arquivo bloqueado (`.js`, `.sh`, `.bin`, `.exe`, `.bat`, `.cmd`, `.py`, `.rb`).

**Solução:**

1. Liste conteúdo do ZIP:
   ```bash
   unzip -l minha-skill.zip
   ```
2. Identifique arquivos executáveis
3. Remova-os e recrie o ZIP apenas com arquivos permitidos (`.json`, `.md`, `.pdf`, `.txt`)

### Problema: "Skill com ID 'X' já está instalada"

**Causa:** Já existe uma Skill com o mesmo `id`.

**Soluções:**

- **Atualizar Skill existente:** Delete a versão antiga via interface (botão Delete no card) e re-upload
- **Criar Skill nova:** Mude o `id` no `manifest.json` para um único (ex: `minha-skill-v2`)

### Problema: "Modelos Ollama não encontrados"

**Causa:** `modelPreferences.chat` ou `modelPreferences.embedding` referenciam modelo não instalado.

**Soluções:**

1. **Via Interface:** Após upload, diálogo "Modelos Faltantes" oferece instalação com barra de progresso
2. **Via CLI:**
   ```bash
   ollama pull gemma3:4b
   ollama pull nomic-embed-text
   ```

**Nota:** Skill será instalada mesmo com modelos faltantes, mas usará modelo padrão do sistema até instalação.

### Problema: Respostas da IA não seguem formato esperado

**Causa:** `prompt.md` ambíguo ou falta de exemplos.

**Soluções:**

- Adicione `fewShotMessages` mostrando o formato exato
- Torne instruções mais explícitas ("Use exatamente este formato: ...")
- Mostre template visual no `prompt.md`
- Teste com modelo mais capaz (`llama3:8b`) antes de simplificar

### Problema: Skill não aparece no seletor

**Causa:** Erro durante instalação ou registro no banco de dados.

**Solução:**

1. Verifique logs do servidor (modo Embedded: `~/Library/Logs/OpenProfIA/server.log`)
2. Teste endpoint manualmente:
   ```bash
   curl http://localhost:3000/api/skills
   ```
3. Se necessário, delete pasta em `packages/skills/[skill-id]` e re-upload

---

## 9. Sistema RAG (Retrieval-Augmented Generation)

### 9.1. Como Funciona

Quando documentos são adicionados a uma Skill (via pasta `knowledge/` ou upload posterior):

```
Upload de Documento
       ↓
Extração de Texto (PDF/TXT/MD)
       ↓
Chunking (quebra em pedaços de ~500 caracteres)
       ↓
Embedding (vetorização via Ollama)
       ↓
Indexação no LanceDB (tabela chunks_{skillId})
       ↓
Disponível para Busca Semântica
```

### 9.2. Processo Detalhado

#### Extração de Texto

- **PDF:** Biblioteca `pdf-parse` extrai texto (não OCR; PDFs com imagens escaneadas podem ter baixa qualidade)
- **TXT/MD:** Leitura direta via `fs.readFile`

#### Chunking

**Parâmetros:**

- `CHUNK_SIZE`: 500 caracteres (padrão)
- `CHUNK_OVERLAP`: 50 caracteres (sobrepõe chunks para manter contexto)

**Estratégia:**

1. Divide texto em chunks de ~500 caracteres
2. Tenta quebrar em limites de frase (`.`, `!`, `?`)
3. Se não houver pontuação, quebra em palavra
4. Mantém 50 caracteres de overlap entre chunks consecutivos

**Exemplo:**

```
Texto: "A fotossíntese é o processo... [500 chars] ...produzindo oxigênio. As plantas verdes..."

Chunk 1: "A fotossíntese é o processo... produzindo oxigênio."
Chunk 2: "produzindo oxigênio. As plantas verdes..." (overlap de 50 chars)
```

#### Embedding

- **Modelo:** `nomic-embed-text` (padrão) ou definido em `modelPreferences.embedding`
- **Dimensão:** 768 (nomic-embed-text)
- **API:** Chamadas sequenciais ao Ollama com delay de 100ms entre requests (evitar sobrecarga)

#### Indexação LanceDB

**Tabela:** `chunks_{skillId}` (ex: `chunks_gerador_questoes`)

**Schema:**

```typescript
{
  id: string,              // UUID do chunk
  skillId: string,         // ID da Skill
  documentId: string,      // Nome do arquivo fonte
  content: string,         // Texto do chunk
  embedding: Float32Array, // Vetor 768-dimensional
  metadata: object,        // { fileName, chunkIndex, uploadedAt }
  createdAt: string        // ISO timestamp
}
```

**Índice:** Busca vetorial por similaridade de cosseno

### 9.3. Uso no Chat

Quando o usuário envia mensagem:

1. **Busca Semântica:**
   - Mensagem do usuário é embedded
   - Busca top-5 chunks mais similares (threshold: 0.3)
   - Ordenação por score de similaridade

2. **Injeção no Contexto:**
   - Chunks recuperados são concatenados
   - Adicionados ao system prompt:

     ```markdown
     [System Prompt da Skill]

     ---

     **Documentos de Referência:**

     [Chunk 1]

     [Chunk 2]

     ...
     ```

3. **Resposta da LLM:**
   - LLM usa contexto enriquecido para responder
   - Pode citar trechos específicos dos documentos

### 9.4. Rastreamento de Jobs

Upload de documentos é **assíncrono** (worker em background).

**Tabela `jobs` (SQLite):**

```sql
{
  id: uuid,
  skill_id: string,
  file_name: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: 0-100,
  error: string | null,
  created_at: timestamp,
  updated_at: timestamp
}
```

**Interface:** Mostra barra de progresso em tempo real (10% → 30% → 50% → 80% → 100%).

### 9.5. Limitações e Otimizações

**Limitações:**

- **Max chunks retornados:** 5 (evitar contexto excessivo)
- **Threshold similaridade:** 0.3 (chunks com score < 0.3 são ignorados)
- **Tamanho arquivo:** 50 MB máximo por documento
- **Processamento:** Sequencial (1 job por vez via worker)

**Otimizações:**

- Chunks são processados em lotes para embeddings (100ms delay entre requests)
- LanceDB usa índices vetoriais nativos (busca rápida mesmo com milhares de chunks)
- Tabelas são scoped por Skill (isolamento, fácil remoção)

### 9.6. Configuração no prompt.md

Instrua a IA sobre como usar RAG:

```markdown
## Contexto Adicional

Se o professor enviar documentos de referência (PDFs, textos), você receberá trechos relevantes automaticamente. Use esse material como base para suas respostas, citando quando apropriado:

**Exemplo:**
"De acordo com o documento fornecido: '[trecho]'..."

Se os documentos fornecerem informação conflitante com seu conhecimento prévio, **priorize o conteúdo dos documentos** fornecidos pelo professor.
```

---

## 10. Templates de prompt.md

### Template 1: Skill de Assessment (Avaliação)

```markdown
# [Nome da Skill de Avaliação]

Você é um especialista em avaliação educacional para o Ensino Básico brasileiro (Educação Infantil, Ensino Fundamental e Ensino Médio). Sua função é ajudar professores a [objetivo específico: criar questões, rubricas, etc.].

## Comportamento

Ao receber uma solicitação do professor, siga estas etapas:

1. **Colete informações necessárias** — Se o professor não especificou, pergunte educadamente:
   - Disciplina (ex: Matemática, Português, Ciências, História, Geografia, etc.)
   - Ano/Série dos alunos (ex: 5º ano do Fundamental, 2º ano do Médio)
   - Tema ou conteúdo específico (ex: frações, verbos irregulares, Revolução Francesa)
   - Nível de dificuldade (fácil, médio ou difícil)
   - Quantidade desejada (padrão: [número])

2. **Gere o conteúdo** seguindo o formato abaixo

## Formato de Saída

[Especifique aqui o formato exato, com exemplo visual]

---

**[Item de Avaliação] [número]:**
[Enunciado/Descrição]

[Estrutura específica: alternativas, critérios, etc.]

**[Campo adicional]:** [Valor]

**[Justificativa/Feedback]:** [Explicação pedagógica]

---

## Diretrizes Pedagógicas

- Use linguagem adequada ao ano/série dos alunos
- Evite questões ambíguas ou com "pegadinhas" desnecessárias
- Alinhe com a BNCC (Base Nacional Comum Curricular) quando possível
- Varie o nível cognitivo conforme a Taxonomia de Bloom (lembrar, compreender, aplicar, analisar, avaliar, criar)
- [Diretriz específica do tipo de avaliação]

## Contexto Adicional

Se o professor enviar documentos de referência (PDFs, textos), use esse material como base para elaborar [itens] alinhados ao conteúdo específico trabalhado em sala de aula. Priorize o conteúdo fornecido pelo professor sobre conhecimento geral.

## Exemplo de Interação

**Professor:** "[Exemplo de solicitação completa]"

[Mostre aqui uma resposta ideal da IA seguindo exatamente o formato]
```

### Template 2: Skill de Content Creation (Criação de Conteúdo)

```markdown
# [Nome da Skill de Criação de Conteúdo]

Você é um [especialista específico: redator educacional, designer instrucional, etc.] focado em auxiliar professores do Ensino Básico brasileiro.

## Comportamento

Quando o professor solicitar [tipo de conteúdo]:

1. **Identifique os requisitos:**
   - [Parâmetro 1]: [Descrição]
   - [Parâmetro 2]: [Descrição]
   - [Parâmetro 3]: [Descrição]

2. **Pergunte se necessário:**
   - Se algum requisito essencial não foi fornecido, pergunte de forma clara e objetiva

3. **Gere o conteúdo** seguindo as diretrizes desta Skill

## Formato de Saída

# [Título do Conteúdo]

[Estrutura específica do tipo de conteúdo]

## [Seção 1]

[Descrição]

## [Seção 2]

[Descrição]

## [Seção 3]

[Descrição]

## Diretrizes de Criação

- **[Aspecto 1]:** [Descrição da regra]
- **[Aspecto 2]:** [Descrição da regra]
- **[Aspecto 3]:** [Descrição da regra]
- **Linguagem:** Adequada ao público-alvo (professores e/ou alunos de [faixa etária])
- **Clareza:** Evite jargões desnecessários; use exemplos concretos
- **Acessibilidade:** Considere diferentes contextos (urbano/rural, recursos limitados)

## Contexto Adicional

Se documentos forem fornecidos (via upload ou pasta knowledge/):

- Use-os como **referência autoritativa**
- Cite trechos quando relevante: "Conforme o material fornecido..."
- Adapte o estilo ao padrão dos documentos (se aplicável)

## Exemplos

### Exemplo 1: [Caso simples]

**Professor:** "[Solicitação]"

**Assistente:**
[Resposta seguindo o formato]

### Exemplo 2: [Caso com parâmetros incompletos]

**Professor:** "[Solicitação vaga]"

**Assistente:**
"Para criar [conteúdo] adequado, preciso de algumas informações adicionais:

- [Pergunta 1]?
- [Pergunta 2]?"
```

---

## 11. Referências e Recursos

### Documentação Técnica

- **Arquitetura Completa:** [ARCHITECT.md](./ARCHITECT.md)
- **Guidelines do Projeto:** [../AGENTS.md](../AGENTS.md)
- **Interfaces TypeScript:** `packages/core/src/interfaces/skill.ts`
- **Validação Backend:** `apps/server/src/services/skill.service.ts`

### Skills de Referência

- **Gerador de Questões:** `packages/skills/gerador-questoes/`
  - Exemplo de manifest completo
  - Prompt pedagógico estruturado
  - Uso de fewShotMessages

### Recursos Educacionais

- **Base Nacional Comum Curricular (BNCC):** http://basenacionalcomum.mec.gov.br/
- **Taxonomia de Bloom (Revisada):** https://cft.vanderbilt.edu/guides-sub-pages/blooms-taxonomy/
- **Metodologias Ativas:** https://porvir.org/especiais/metodologias/

### Ferramentas

- **Validador JSON:** https://jsonlint.com/
- **Ollama (LLM local):** https://ollama.ai/
- **Markdown Guide:** https://www.markdownguide.org/

---

## 12. Contribuindo com Skills

### Compartilhando com a Comunidade

Skills de alta qualidade podem ser contribuídas para o repositório oficial:

1. **Fork** o repositório OpenProfIA
2. Adicione sua Skill em `packages/skills/[sua-skill]/`
3. Teste localmente (seção 6)
4. Abra **Pull Request** com:
   - Descrição clara do propósito
   - Casos de uso testados
   - Screenshots da interface (opcional)

### Critérios de Qualidade

Skills aceitas no repositório oficial devem:

- [ ] Seguir todas as regras de validação (seção 3)
- [ ] Servir propósito educacional claro e não-duplicado
- [ ] Incluir `prompt.md` bem estruturado e testado
- [ ] Ter documentação básica (pode ser no próprio PR)
- [ ] Respeitar direitos autorais (knowledge/ deve ter licença compatível)

### Licenciamento

Skills contribuídas devem ser compatíveis com a licença do projeto OpenProfIA (verifique `LICENSE` no repositório).
