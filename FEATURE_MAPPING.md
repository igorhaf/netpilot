# 🗺️ Mapeamento Completo de Features - NetPilot

**Data**: 04/10/2025
**Status**: Em Análise

---

## 📊 SISTEMA ATUAL - O QUE EXISTE

### 1️⃣ **SISTEMA CORE (Proxy Reverso + SSL)** - ✅ 100% Implementado
- ✅ Gestão de Domínios
- ✅ Proxy Rules com prioridades
- ✅ Redirects 301/302
- ✅ SSL Automático (Let's Encrypt)
- ✅ Dashboard com métricas
- ✅ Sistema de Logs
- ✅ Autenticação JWT

### 2️⃣ **NOVA FUNCIONALIDADE - Projetos + IA** - ⚠️ PARCIALMENTE Implementado

#### Backend - Entidades
- ✅ `Project` entity com campos:
  - `id`, `name`, `alias`, `projectPath`
  - `repository`, `cloned`, `hasSshKey`
  - `defaultPromptTemplate` ✅
  - `executionMode` ('realtime' | 'queue') ✅
  - `stacks` (ManyToMany) ✅
  - `presets` (ManyToMany) ✅

- ✅ `Stack` entity com campos:
  - `id`, `name`, `description`, `technology`
  - `color`, `version`, `author`, `tags`
  - `presets` (ManyToMany) ✅

- ✅ `Preset` entity com campos:
  - `id`, `name`, `description`, `type`
  - `content`, `language`, `filename`
  - `stacks` (ManyToMany) ✅

#### Backend - Módulos
- ✅ `ProjectsModule` - CRUD completo
- ✅ `StacksModule` - CRUD completo
- ✅ `PresetsModule` - CRUD completo ✅ (criado na sessão anterior)
- ✅ `JobQueuesModule` - Sistema de filas Redis
- ✅ `TerminalModule` - Terminal WebSocket
- ✅ `DatabaseModule` - Interface pgAdmin/phpMyAdmin-like

#### Backend - Serviços Especiais
- ✅ `ProjectsService.create()` - Cria usuário Linux + pasta `/home/{alias}`
- ✅ `AI Prompt Handler` - Script que executa Claude CLI
- ✅ Terminal WebSocket funcionando

#### Frontend - Páginas Implementadas
- ✅ `/projects` - Listagem de projetos
- ✅ `/projects/new` - Criar projeto
- ✅ `/projects/[id]` - Detalhes do projeto com:
  - ✅ Tab "Chat" - Interface de chat ✅
  - ✅ Tab "Terminal" - Terminal integrado ✅
  - ✅ Tab "Info" - Informações do projeto ✅
  - ✅ Toggle Realtime/Fila ✅ (implementado)
- ✅ `/preset-library` - Listagem de stacks
- ✅ `/preset-library/create` - Criar stack/presets
- ✅ `/preset-library/[id]` - Detalhes da stack
- ✅ `/job-queues` - Gerenciamento de jobs
- ✅ `/job-executions` - Histórico de execuções
- ✅ `/database` - Interface de banco de dados

---

## ❌ O QUE ESTÁ FALTANDO (GAPS IDENTIFICADOS)

### 🔴 CRÍTICO - Impedem o Fluxo Funcionar

#### 1. **Componente StackSelector** - ❌ NÃO EXISTE
**Localização Esperada**: `/frontend/src/components/projects/StackSelector.tsx`
**Problema**: `/projects/new/page.tsx` importa `StackSelector` mas o arquivo **não existe**
**Impacto**: ❌ Não é possível selecionar Stacks/Presets ao criar projeto

#### 2. **Aplicação de Presets ao Criar Projeto** - ❌ NÃO IMPLEMENTADO
**Localização**: `/backend/src/modules/projects/projects.service.ts`
**Problema**: Quando cria projeto, não copia os presets para `/home/{alias}/contexts`
**Impacto**: ❌ Presets ficam apenas no banco, não são usados pelo Claude CLI

#### 3. **Integração PROJECT_ALIAS no Prompt Handler** - ⚠️ PARCIAL
**Localização**: `/backend/src/modules/job-queues/scripts/ai-prompt-handler.script.ts`
**Status Atual**: ✅ Já usa `PROJECT_ALIAS` e `PROMPT_TEMPLATE`
**Problema**: ❌ Não carrega os presets da pasta `/home/{alias}/contexts`

#### 4. **Seeds de Stacks/Presets** - ❌ NÃO EXISTE
**Problema**: Banco vazio, sem exemplos de Stacks (Laravel, Next.js, etc.)
**Impacto**: ❌ Usuário não tem exemplos para começar

---

### 🟡 IMPORTANTE - Melhorias de UX

#### 5. **Frontend: Seletor de Presets Soltos** - ❌ NÃO EXISTE
**O que é**: Permitir selecionar presets que não pertencem a nenhuma stack
**Onde usar**: `/projects/new/page.tsx`

#### 6. **Frontend: Campo defaultPromptTemplate** - ❌ NÃO EXISTE no Form
**Problema**: Campo existe na entidade mas não aparece no formulário
**Impacto**: ⚠️ Não é possível definir template padrão ao criar projeto

#### 7. **Frontend: Exibir Stacks/Presets nos Detalhes do Projeto** - ❌ NÃO EXISTE
**Problema**: `/projects/[id]/page.tsx` não mostra quais stacks/presets estão associados
**Impacto**: ⚠️ Usuário não sabe quais tecnologias o projeto tem

#### 8. **Backend: Endpoint para Listar Presets de uma Stack** - ✅ EXISTE
**Status**: Já existe `GET /presets/stack/:stackId`

---

### 🟢 OPCIONAL - Features Futuras

#### 9. **Edição de Projeto** - ❌ NÃO EXISTE
**Problema**: Não é possível editar stacks/presets depois de criar
**Localização**: `/projects/[id]/edit/page.tsx` não existe

#### 10. **Gestão de Contextos** - ❌ NÃO EXISTE
**O que é**: Interface para editar arquivos em `/home/{alias}/contexts`
**Benefício**: Editar personas e configs sem SSH

#### 11. **Visualização de Logs do Claude** - ⚠️ PARCIAL
**Status Atual**: Job Executions mostra output
**Melhoria**: Exibir em tempo real no chat enquanto executa

---

## 🎯 FLUXO COMPLETO ESPERADO (Como Deveria Funcionar)

### **Fase 1: Preparação (Admin)**
```
1. Admin acessa /preset-library/create
2. Cria Stack "Laravel Fullstack"
   - Adiciona Preset "Docker Compose" (type: docker, content: docker-compose.yml)
   - Adiciona Preset "Persona Backend" (type: persona, content: "Você é...")
   - Adiciona Preset "Config Larav el" (type: config, content: ".env.example")
3. Sistema salva no banco: stack + presets com relacionamento
```

### **Fase 2: Criação de Projeto (Dev)**
```
1. Dev acessa /projects/new
2. Preenche formulário:
   - Nome: "E-commerce API"
   - Alias: "ecommerce-api"
   - Repository: "git@github.com:user/ecommerce.git"
   - ✅ Seleciona Stack "Laravel Fullstack" (StackSelector)
   - ✅ Seleciona Presets Soltos: "PostgreSQL Docker", "Redis Config"
   - ✅ Define defaultPromptTemplate: "Sempre use TypeScript strict mode"
   - ✅ Escolhe executionMode: "realtime"
3. Submete form → API POST /projects

Backend processa:
   ✅ Cria usuário Linux "ecommerce-api"
   ✅ Cria pasta /home/ecommerce-api/
   ✅ Salva projeto no banco com stacks/presets associados
   ❌ **FALTA**: Copia presets para /home/ecommerce-api/contexts/:
      - /home/ecommerce-api/contexts/docker-compose.yml
      - /home/ecommerce-api/contexts/persona.md
      - /home/ecommerce-api/contexts/config/.env.example
   ✅ Clona repositório para /home/ecommerce-api/code/
```

### **Fase 3: Uso do Claude CLI (Dev)**
```
1. Dev acessa /projects/{id} → Tab "Chat"
2. Vê toggle "Realtime" selecionado (do executionMode)
3. Digita prompt: "Crie um CRUD de produtos"
4. Sistema:
   ✅ Cria JobQueue com:
      - PROJECT_ID, PROJECT_NAME, PROJECT_ALIAS
      - USER_PROMPT: "Crie um CRUD de produtos"
      - PROMPT_TEMPLATE: "Sempre use TypeScript strict mode"
   ✅ Se realtime: executa imediatamente
   ✅ Se queue: adiciona ao Redis
   ✅ AI Handler executa:
      ✅ Verifica Claude CLI instalado
      ✅ cd /home/ecommerce-api/code
      ❌ **FALTA**: Concatena PROMPT_TEMPLATE + USER_PROMPT
      ❌ **FALTA**: Informa Claude sobre arquivos em /contexts
      ✅ Executa: claude "Sempre use TypeScript... Crie um CRUD..."
      ✅ Retorna output
   ✅ Frontend exibe resposta no chat
```

---

## 📋 RESUMO DOS GAPS

| # | Feature | Status | Criticidade | Localização |
|---|---------|--------|-------------|-------------|
| 1 | StackSelector component | ❌ Não existe | 🔴 CRÍTICO | `/frontend/src/components/projects/StackSelector.tsx` |
| 2 | Aplicar presets ao criar projeto | ❌ Não implementado | 🔴 CRÍTICO | `/backend/src/modules/projects/projects.service.ts:create()` |
| 3 | Carregar contexts no Prompt Handler | ❌ Não implementado | 🔴 CRÍTICO | `/backend/src/modules/job-queues/scripts/ai-prompt-handler.script.ts` |
| 4 | Seeds de Stacks/Presets | ❌ Não existe | 🔴 CRÍTICO | `/backend/src/seeds/stacks-presets.seed.ts` |
| 5 | PresetSelector component | ❌ Não existe | 🟡 IMPORTANTE | `/frontend/src/components/projects/PresetSelector.tsx` |
| 6 | Campo defaultPromptTemplate | ❌ Falta no form | 🟡 IMPORTANTE | `/frontend/src/app/projects/new/page.tsx` |
| 7 | Exibir stacks/presets no projeto | ❌ Não mostra | 🟡 IMPORTANTE | `/frontend/src/app/projects/[id]/page.tsx` |
| 8 | Edição de projeto | ❌ Não existe | 🟢 OPCIONAL | `/frontend/src/app/projects/[id]/edit/page.tsx` |
| 9 | Gestão de contextos | ❌ Não existe | 🟢 OPCIONAL | `/frontend/src/app/projects/[id]/contexts/page.tsx` |

---

## 🚀 PRÓXIMO PASSO

**AGUARDANDO VALIDAÇÃO DO USUÁRIO**

Este mapeamento está correto? Há algo que identifiquei errado ou que está faltando?

Após confirmação, montarei um plano de implementação detalhado com prioridades.
