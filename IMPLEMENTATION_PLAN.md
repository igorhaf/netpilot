# 🚀 Plano Completo de Implementação - NetPilot

**Data**: 04/10/2025
**Versão**: 1.0
**Status**: Aguardando Execução

---

## 📌 DEFINIÇÃO DO SISTEMA

**NetPilot** = **Desenvolvedor de Código Síncrono/Assíncrono com Ambiente Simulado de Produção**

### Componentes Principais:
1. **Motor de Código**: Claude CLI executando prompts do usuário
2. **Execução**: Síncrona (tempo real) ou Assíncrona (fila Redis)
3. **Ambiente Simulado**: Proxy Reverso + SSL + Domínios para testes
4. **Gestão de Contexto**: Stacks + Presets aplicados ao projeto

### Fluxo Completo:
```
Admin cria Stack "Laravel" com Presets (docker-compose, persona, configs)
  ↓
Dev cria Projeto "E-commerce" selecionando Stack + Presets soltos
  ↓
Sistema copia Presets para /home/ecommerce/contexts/
  ↓
Dev envia prompt: "Crie CRUD de produtos"
  ↓
Claude CLI executa no /home/ecommerce/code com contextos carregados
  ↓
Código gerado é testado via Proxy/SSL configurado
```

---

## 🎯 PRIORIZAÇÃO

### 🔴 **FASE 1 - CRÍTICO** (Sistema Funcional Mínimo)
**Objetivo**: Fazer o fluxo completo funcionar end-to-end

#### 1.1 Frontend - Componentes de Seleção
**Impacto**: Sem isso, não é possível criar projetos com stacks/presets

- [ ] **StackSelector Component** (`/frontend/src/components/projects/StackSelector.tsx`)
  - Listar stacks disponíveis
  - Exibir presets de cada stack
  - Permitir seleção múltipla
  - Preview dos presets incluídos

- [ ] **PresetSelector Component** (`/frontend/src/components/projects/PresetSelector.tsx`)
  - Listar presets soltos (sem stack associada)
  - Filtrar por tipo (docker, persona, config, etc.)
  - Seleção múltipla independente de stacks

**Estimativa**: 2-3 horas
**Dependências**: Nenhuma
**Prioridade**: 🔴 MÁXIMA

---

#### 1.2 Backend - Aplicação de Presets
**Impacto**: Sem isso, presets ficam apenas no banco sem utilidade prática

**Arquivo**: `/backend/src/modules/projects/projects.service.ts`

**Modificações**:
```typescript
async create(createProjectDto: CreateProjectDto): Promise<Project> {
  // 1. Criar projeto (já existe)
  const project = await this.createProjectRecord(createProjectDto);

  // 2. Criar usuário Linux (já existe)
  await this.createLinuxUser(project.alias);

  // 3. ⚠️ NOVO: Aplicar presets ao diretório
  await this.applyPresetsToProject(project);

  // 4. Clonar repositório (já existe)
  if (project.repository) {
    await this.cloneRepository(project);
  }

  return project;
}

// ⚠️ NOVO MÉTODO
async applyPresetsToProject(project: Project): Promise<void> {
  const contextsPath = `/home/${project.alias}/contexts`;

  // Criar estrutura de pastas
  await exec(`mkdir -p ${contextsPath}/{docker,personas,configs,scripts,templates}`);

  // Processar presets de todas as stacks associadas
  for (const stack of project.stacks || []) {
    for (const preset of stack.presets) {
      await this.writePresetFile(contextsPath, preset);
    }
  }

  // Processar presets soltos
  for (const preset of project.presets || []) {
    await this.writePresetFile(contextsPath, preset);
  }

  // Ajustar permissões
  await exec(`chown -R ${project.alias}:projects ${contextsPath}`);
  await exec(`chmod -R 755 ${contextsPath}`);
}

// ⚠️ NOVO MÉTODO
async writePresetFile(basePath: string, preset: Preset): Promise<void> {
  const typeDir = {
    'docker': 'docker',
    'persona': 'personas',
    'config': 'configs',
    'script': 'scripts',
    'template': 'templates'
  }[preset.type];

  const filename = preset.filename || `${preset.name}.${this.getExtension(preset)}`;
  const fullPath = `${basePath}/${typeDir}/${filename}`;

  await fs.promises.writeFile(fullPath, preset.content, 'utf-8');

  // Tornar scripts executáveis
  if (preset.type === 'script') {
    await exec(`chmod +x ${fullPath}`);
  }
}
```

**Estimativa**: 2 horas
**Dependências**: Nenhuma
**Prioridade**: 🔴 MÁXIMA

---

#### 1.3 Backend - Integração de Contextos no AI Handler
**Impacto**: Claude CLI precisa conhecer os contextos para gerar código apropriado

**Arquivo**: `/backend/src/modules/job-queues/scripts/ai-prompt-handler.script.ts`

**Modificações**:
```typescript
export async function execute(context: ScriptExecutionContext): Promise<JobExecutionResult> {
  // ... código existente ...

  const projectPath = isDocker ? `/host/home/${projectAlias}/code` : `/home/${projectAlias}/code`;
  const contextsPath = isDocker ? `/host/home/${projectAlias}/contexts` : `/home/${projectAlias}/contexts`;

  // ⚠️ NOVO: Carregar informações de contexto
  const contextInfo = await this.loadContexts(contextsPath);

  // ⚠️ NOVO: Construir prompt com contextos
  let finalPrompt = '';

  // Adicionar informações de contexto
  if (contextInfo.personas.length > 0) {
    finalPrompt += `📋 CONTEXTO - Personas:\n`;
    for (const persona of contextInfo.personas) {
      finalPrompt += `${persona.content}\n\n`;
    }
  }

  if (contextInfo.configs.length > 0) {
    finalPrompt += `📋 CONTEXTO - Configurações disponíveis:\n`;
    finalPrompt += contextInfo.configs.map(c => `- ${c.name}`).join('\n') + '\n\n';
  }

  if (contextInfo.docker.length > 0) {
    finalPrompt += `📋 CONTEXTO - Docker Compose:\n`;
    finalPrompt += `Arquivos: ${contextInfo.docker.map(d => d.name).join(', ')}\n\n`;
  }

  // Adicionar template padrão
  if (promptTemplate) {
    finalPrompt += `📋 INSTRUÇÕES PADRÃO:\n${promptTemplate}\n\n`;
  }

  // Adicionar prompt do usuário
  finalPrompt += `📋 TAREFA:\n${userPrompt}`;

  // Executar Claude CLI
  const escaped = finalPrompt.replace(/"/g, '\\"').replace(/\$/g, '\\$');
  const { stdout: result } = await execAsync(
    `cd ${projectPath} && claude "${escaped}"`,
    { timeout: 300000, maxBuffer: 10 * 1024 * 1024 }
  );

  // ... restante do código ...
}

// ⚠️ NOVO MÉTODO
async function loadContexts(contextsPath: string) {
  const fs = require('fs').promises;
  const result = {
    personas: [],
    configs: [],
    docker: [],
    scripts: [],
    templates: []
  };

  // Carregar personas
  const personasPath = `${contextsPath}/personas`;
  if (await this.directoryExists(personasPath)) {
    const files = await fs.readdir(personasPath);
    for (const file of files) {
      const content = await fs.readFile(`${personasPath}/${file}`, 'utf-8');
      result.personas.push({ name: file, content });
    }
  }

  // Carregar configs
  const configsPath = `${contextsPath}/configs`;
  if (await this.directoryExists(configsPath)) {
    const files = await fs.readdir(configsPath);
    for (const file of files) {
      result.configs.push({ name: file });
    }
  }

  // Carregar docker compose
  const dockerPath = `${contextsPath}/docker`;
  if (await this.directoryExists(dockerPath)) {
    const files = await fs.readdir(dockerPath);
    for (const file of files) {
      result.docker.push({ name: file });
    }
  }

  return result;
}
```

**Estimativa**: 2 horas
**Dependências**: 1.2 (aplicação de presets)
**Prioridade**: 🔴 MÁXIMA

---

#### 1.4 Backend - Seeds de Exemplo
**Impacto**: Banco vazio dificulta demonstração e testes

**Arquivo**: `/backend/src/seeds/stacks-presets.seed.ts` (criar)

**Conteúdo**:
```typescript
import { DataSource } from 'typeorm';
import { Stack } from '../entities/stack.entity';
import { Preset } from '../entities/preset.entity';

export class StacksPresetsSeed {
  async run(dataSource: DataSource): Promise<void> {
    const stackRepo = dataSource.getRepository(Stack);
    const presetRepo = dataSource.getRepository(Preset);

    // 1. Stack Laravel
    const laravelStack = await this.createLaravelStack(stackRepo, presetRepo);

    // 2. Stack Next.js
    const nextStack = await this.createNextStack(stackRepo, presetRepo);

    // 3. Stack React Native
    const rnStack = await this.createReactNativeStack(stackRepo, presetRepo);

    // 4. Presets Soltos (compartilhados)
    await this.createSharedPresets(presetRepo);
  }

  async createLaravelStack(stackRepo, presetRepo) {
    // Docker Compose para Laravel
    const dockerCompose = await presetRepo.save({
      name: 'Laravel Docker Stack',
      type: 'docker',
      filename: 'docker-compose.yml',
      content: `version: '3.8'
services:
  app:
    image: php:8.2-fpm
    volumes:
      - ./:/var/www
  nginx:
    image: nginx:alpine
    ports:
      - "8000:80"
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: laravel`,
      tags: ['laravel', 'php', 'docker']
    });

    // Persona Backend
    const persona = await presetRepo.save({
      name: 'Laravel Backend Developer',
      type: 'persona',
      filename: 'backend-developer.md',
      content: `# Persona: Laravel Backend Developer

Você é um desenvolvedor Laravel experiente. Sempre siga estas diretrizes:

- Use PHP 8.2+ com type hints
- Siga PSR-12 para formatação
- Crie migrations para todas as alterações de schema
- Use Eloquent ORM com relationships corretas
- Implemente validação via Form Requests
- Crie testes Feature e Unit
- Use Services para lógica de negócio complexa
- Documente APIs com annotations`,
      tags: ['laravel', 'backend', 'persona']
    });

    // Config .env
    const envConfig = await presetRepo.save({
      name: 'Laravel Environment Template',
      type: 'config',
      filename: '.env.example',
      content: `APP_NAME=Laravel
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=root`,
      tags: ['laravel', 'config']
    });

    const stack = stackRepo.create({
      name: 'Laravel Fullstack',
      description: 'Stack completo para desenvolvimento Laravel com PHP 8.2, MySQL e Docker',
      technology: 'PHP/Laravel',
      color: '#FF2D20',
      icon: '🔴',
      version: '10.x',
      author: 'NetPilot',
      tags: ['laravel', 'php', 'backend', 'api'],
      presets: [dockerCompose, persona, envConfig]
    });

    return await stackRepo.save(stack);
  }

  async createNextStack(stackRepo, presetRepo) {
    const dockerCompose = await presetRepo.save({
      name: 'Next.js Docker Stack',
      type: 'docker',
      filename: 'docker-compose.yml',
      content: `version: '3.8'
services:
  app:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./:/app
    command: npm run dev
    ports:
      - "3000:3000"`,
      tags: ['nextjs', 'docker']
    });

    const persona = await presetRepo.save({
      name: 'Next.js Frontend Developer',
      type: 'persona',
      filename: 'frontend-developer.md',
      content: `# Persona: Next.js Frontend Developer

Você é um desenvolvedor Next.js/React experiente. Sempre siga:

- Use TypeScript strict mode
- Next.js 14 App Router
- React Server Components quando possível
- TailwindCSS para estilização
- Componentes funcionais com hooks
- TanStack Query para data fetching
- Zod para validação
- Teste com React Testing Library`,
      tags: ['nextjs', 'frontend', 'persona']
    });

    const tsConfig = await presetRepo.save({
      name: 'TypeScript Config',
      type: 'config',
      filename: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "noEmit": true,
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`,
      tags: ['nextjs', 'typescript', 'config']
    });

    const stack = stackRepo.create({
      name: 'Next.js Fullstack',
      description: 'Stack moderno para apps Next.js 14 com TypeScript e TailwindCSS',
      technology: 'JavaScript/Next.js',
      color: '#000000',
      icon: '⚫',
      version: '14.x',
      author: 'NetPilot',
      tags: ['nextjs', 'react', 'frontend', 'fullstack'],
      presets: [dockerCompose, persona, tsConfig]
    });

    return await stackRepo.save(stack);
  }

  async createSharedPresets(presetRepo) {
    // PostgreSQL Docker (preset solto)
    await presetRepo.save({
      name: 'PostgreSQL Docker',
      type: 'docker',
      filename: 'docker-compose.postgres.yml',
      content: `version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: database
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:`,
      tags: ['postgresql', 'database', 'shared']
    });

    // Redis Docker (preset solto)
    await presetRepo.save({
      name: 'Redis Docker',
      type: 'docker',
      filename: 'docker-compose.redis.yml',
      content: `version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
volumes:
  redis_data:`,
      tags: ['redis', 'cache', 'shared']
    });
  }
}
```

**Comando de execução**:
```bash
npm run seed:stacks
```

**Estimativa**: 3 horas
**Dependências**: Nenhuma (pode rodar em paralelo)
**Prioridade**: 🔴 ALTA

---

### 🟡 **FASE 2 - IMPORTANTE** (Melhorias de UX)

#### 2.1 Frontend - Campo defaultPromptTemplate
**Impacto**: Usuário não consegue definir instruções padrão

**Arquivo**: `/frontend/src/app/projects/new/page.tsx`

**Modificação**:
```typescript
<div className="space-y-2">
  <label className="text-sm font-medium">Template de Prompt Padrão (Opcional)</label>
  <textarea
    value={formData.defaultPromptTemplate || ''}
    onChange={(e) => setFormData({...formData, defaultPromptTemplate: e.target.value})}
    placeholder="Ex: Sempre use TypeScript strict mode e crie testes unitários"
    rows={4}
    className="w-full px-3 py-2 border rounded-lg"
  />
  <p className="text-xs text-muted-foreground">
    Estas instruções serão aplicadas a todos os prompts deste projeto
  </p>
</div>
```

**Estimativa**: 30 minutos
**Prioridade**: 🟡 MÉDIA

---

#### 2.2 Frontend - Exibir Stacks/Presets no Projeto
**Impacto**: Usuário não sabe quais tecnologias estão configuradas

**Arquivo**: `/frontend/src/app/projects/[id]/page.tsx`

**Modificação**: Adicionar nova tab "Tecnologias" ou seção na tab "Info"

```typescript
<div className="space-y-4">
  <div>
    <h3 className="font-semibold mb-2">Stacks Associadas</h3>
    <div className="flex flex-wrap gap-2">
      {project.stacks?.map(stack => (
        <div key={stack.id} className="px-3 py-1 bg-muted rounded-full text-sm">
          {stack.icon} {stack.name}
        </div>
      ))}
    </div>
  </div>

  <div>
    <h3 className="font-semibold mb-2">Presets Aplicados ({project.presets?.length || 0})</h3>
    <div className="space-y-1">
      {project.presets?.map(preset => (
        <div key={preset.id} className="flex items-center gap-2 text-sm">
          <Badge variant={preset.type}>{preset.type}</Badge>
          <span>{preset.name}</span>
        </div>
      ))}
    </div>
  </div>
</div>
```

**Estimativa**: 1 hora
**Prioridade**: 🟡 MÉDIA

---

### 🟢 **FASE 3 - OPCIONAL** (Features Futuras)

#### 3.1 Edição de Projeto
**Arquivo**: `/frontend/src/app/projects/[id]/edit/page.tsx`

Permitir adicionar/remover stacks e presets após criação.

**Estimativa**: 3 horas
**Prioridade**: 🟢 BAIXA

---

#### 3.2 Gestão de Contextos
**Arquivo**: `/frontend/src/app/projects/[id]/contexts/page.tsx`

Interface para editar arquivos em `/home/{alias}/contexts` sem precisar de SSH.

**Estimativa**: 4 horas
**Prioridade**: 🟢 BAIXA

---

#### 3.3 Logs em Tempo Real no Chat
Exibir output do Claude CLI em tempo real usando WebSocket.

**Estimativa**: 2 horas
**Prioridade**: 🟢 BAIXA

---

## 📊 RESUMO DE ESFORÇO

| Fase | Tarefas | Tempo Estimado | Prioridade |
|------|---------|----------------|------------|
| 🔴 Fase 1 | 4 tarefas críticas | ~9-10 horas | MÁXIMA |
| 🟡 Fase 2 | 2 tarefas importantes | ~1.5 horas | MÉDIA |
| 🟢 Fase 3 | 3 tarefas opcionais | ~9 horas | BAIXA |

**Total para MVP funcional (Fase 1)**: ~10 horas

---

## ✅ CHECKLIST DE EXECUÇÃO

### Fase 1 (Ordem de Execução)
1. [ ] Criar seeds (pode rodar independente)
2. [ ] Criar StackSelector component
3. [ ] Criar PresetSelector component
4. [ ] Implementar aplicação de presets no ProjectsService
5. [ ] Integrar contextos no AI Prompt Handler
6. [ ] Testar fluxo completo end-to-end
7. [ ] Build e deploy backend
8. [ ] Build e deploy frontend

### Fase 2
9. [ ] Adicionar campo defaultPromptTemplate no form
10. [ ] Exibir stacks/presets na página do projeto

### Fase 3 (Futuro)
11. [ ] Implementar edição de projeto
12. [ ] Criar interface de gestão de contextos
13. [ ] Adicionar logs em tempo real

---

## 🎯 DEFINIÇÃO DE "PRONTO"

A **Fase 1** estará completa quando:

1. ✅ Admin consegue criar Stack "Laravel" com 3 presets (docker, persona, config)
2. ✅ Dev consegue criar Projeto "Test" selecionando a stack Laravel
3. ✅ Sistema copia automaticamente os 3 presets para `/home/test/contexts/`
4. ✅ Dev acessa `/projects/{id}` e envia prompt: "Liste os arquivos do projeto"
5. ✅ Claude CLI executa com contextos carregados (docker, persona, config)
6. ✅ Output aparece no chat
7. ✅ Toggle "Tempo Real" / "Fila" funciona corretamente
8. ✅ Modo Fila adiciona job ao Redis e executa em background

---

## 🚀 PRÓXIMO PASSO

**AGUARDANDO APROVAÇÃO DO USUÁRIO**

Perguntas para validação:
1. Este plano cobre todas as features necessárias?
2. A priorização está correta?
3. Há alguma feature crítica faltando?
4. Posso iniciar a execução da Fase 1?
