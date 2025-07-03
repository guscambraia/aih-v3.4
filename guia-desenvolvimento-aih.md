
# 📚 Guia de Desenvolvimento - Sistema de Controle de Auditoria AIH

## 📋 Índice
1. [Visão Geral do Sistema](#visão-geral)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Arquitetura do Sistema](#arquitetura)
4. [Banco de Dados](#banco-de-dados)
5. [API e Rotas](#api-e-rotas)
6. [Frontend](#frontend)
7. [Sistema de Cache e Performance](#cache-performance)
8. [Monitoramento e Logs](#monitoramento)
9. [Backup e Arquivamento](#backup-arquivamento)
10. [Como Adicionar Novas Funcionalidades](#novas-funcionalidades)
11. [Padrões e Convenções](#padrões)
12. [Comandos Úteis](#comandos)

## 🎯 Visão Geral do Sistema {#visão-geral}

### Propósito
Sistema web para controle e auditoria de AIH (Autorização de Internação Hospitalar), gerenciando o fluxo entre auditoria hospitalar e auditoria do SUS, com foco em performance, escalabilidade e gestão de grandes volumes de dados.

### Tecnologias Utilizadas
- **Backend**: Node.js + Express.js
- **Banco de Dados**: SQLite com otimizações avançadas
- **Frontend**: HTML5 + CSS3 + JavaScript puro (SPA)
- **Autenticação**: JWT (JSON Web Tokens)
- **Hash de Senha**: bcryptjs
- **Cache**: Sistema de cache em memória multicamadas
- **Compressão**: gzip para respostas HTTP
- **Monitoramento**: Sistema interno de logs e métricas

### Funcionalidades Principais
- Sistema de login multiusuário com gestão de usuários
- Cadastro e gestão de AIHs com validações robustas
- Controle de movimentações (entrada/saída) com histórico completo
- Gestão de glosas e pendências com tipos configuráveis
- Sistema avançado de relatórios e análises
- Exportação de dados (CSV, Excel, JSON) com filtros
- Backup automático e manual do sistema
- Arquivamento automático de dados antigos
- Sistema de exclusão com justificativas e auditoria
- Monitoramento de performance em tempo real
- Cache inteligente para otimização de consultas

## 📁 Estrutura de Arquivos {#estrutura-de-arquivos}

```
projeto-aih/
│
├── 📄 server.js              # Servidor principal e rotas da API
├── 📄 database.js            # Configuração e funções do banco de dados com cache
├── 📄 auth.js               # Sistema de autenticação JWT
├── 📄 middleware.js         # Middlewares de segurança e performance
├── 📄 monitor.js            # Sistema de monitoramento e métricas
├── 📄 archiving.js          # Sistema de arquivamento automático
├── 📄 cleanup.js            # Limpeza e manutenção automatizada
├── 📄 package.json          # Dependências do projeto
├── 📄 package-lock.json     # Lock das dependências
│
├── 📁 db/                   # Pasta do banco de dados
│   ├── 📄 aih.db           # Arquivo do banco SQLite
│   ├── 📄 aih.db-shm       # Shared memory do SQLite
│   └── 📄 aih.db-wal       # Write-Ahead Log do SQLite
│
├── 📁 public/               # Arquivos estáticos (frontend)
│   ├── 📄 index.html       # Página HTML única (SPA) com todas as telas
│   ├── 📄 style.css        # Estilos CSS otimizados
│   └── 📄 app.js          # Lógica JavaScript do frontend (SPA)
│
├── 📁 docs/                 # Documentação
│   ├── 📄 estrutura-db.md  # Estrutura das tabelas e relacionamentos
│   ├── 📄 api-endpoints.md # Documentação completa da API
│   ├── 📄 fluxo-telas.md   # Fluxo de navegação e UX
│   └── 📄 guia-desenvolvimento-aih.md # Este guia
│
└── 📁 attached_assets/      # Assets anexados (logs, capturas)
```

## 🏗️ Arquitetura do Sistema {#arquitetura}

### Backend (Node.js)

#### server.js
- **Função**: Servidor Express principal
- **Responsabilidades**:
  - Configurar middlewares de segurança (helmet, rate limiting, CORS)
  - Definir todas as rotas da API com validações
  - Servir arquivos estáticos otimizados
  - Implementar lógica de negócios complexa
  - Sistema de relatórios avançados
  - Gestão de usuários e permissões
  - APIs de exportação e backup

#### database.js
- **Função**: Gerenciamento avançado do banco de dados
- **Exports**:
  - `initDB()`: Inicializa tabelas com índices otimizados
  - `run()`: Executa comandos com cache e validação
  - `get()`: Busca um registro com cache inteligente
  - `all()`: Busca múltiplos registros com paginação
  - `validateMovimentacao()`: Validações de negócio
  - `clearCache()`: Gerenciamento de cache
- **Features**:
  - Sistema de cache multicamadas
  - Connection pooling otimizado
  - Validações automáticas
  - Logs de performance

#### auth.js
- **Função**: Autenticação e segurança avançada
- **Exports**:
  - `verificarToken()`: Middleware de autenticação JWT
  - `login()`: Função de login com validações
  - `cadastrarUsuario()`: Criar novo usuário
  - `verificarAdmin()`: Verificação de permissões admin

#### middleware.js
- **Função**: Middlewares de segurança e performance
- **Features**:
  - Rate limiting por IP e usuário
  - Headers de segurança (helmet)
  - Compressão gzip
  - Logs de auditoria
  - Validações de entrada

#### monitor.js
- **Função**: Monitoramento e métricas do sistema
- **Features**:
  - Estatísticas de performance em tempo real
  - Monitoramento de uso de recursos
  - Logs estruturados
  - Alertas automáticos

#### archiving.js
- **Função**: Arquivamento automático de dados antigos
- **Features**:
  - Arquivamento baseado em tempo
  - Compressão de dados históricos
  - Otimização de espaço
  - Logs de arquivamento

#### cleanup.js
- **Função**: Limpeza e manutenção automatizada
- **Features**:
  - Limpeza de arquivos temporários
  - Otimização do banco de dados
  - Manutenção preventiva

### Frontend (SPA - Single Page Application)

#### index.html
- Contém todas as telas em divs com classe `tela`
- Apenas uma tela visível por vez (classe `ativa`)
- **Telas principais**:
  - `telaLogin`: Autenticação de usuários
  - `telaPrincipal`: Dashboard com estatísticas
  - `telaInformarAIH`: Busca de AIH existente
  - `telaCadastroAIH`: Cadastro de nova AIH
  - `telaInfoAIH`: Visualização de dados da AIH
  - `telaMovimentacao`: Nova movimentação na AIH
  - `telaPendencias`: Gestão de glosas e pendências
  - `telaPesquisa`: Pesquisa avançada com filtros
  - `telaConfiguracoes`: Configurações do sistema
  - `telaRelatorios`: Relatórios e análises
  - `telaGestaoUsuarios`: Gestão de usuários (admin)
  - `telaAlteracaoBD`: Exclusões com justificativas

#### app.js
- **Estado Global**: objeto `state` com dados da sessão
- **Funcões Principais**:
  - `api()`: Helper para chamadas à API com cache
  - `mostrarTela()`: Navegação entre telas com transições
  - `carregarDashboard()`: Atualiza estatísticas em tempo real
  - Sistema completo de gestão de formulários
  - Validações frontend robustas
  - Cache de dados no cliente
  - Handlers de eventos otimizados

#### style.css
- Estilos modernos com variáveis CSS
- **Classes importantes**:
  - `.tela` / `.tela.ativa`: Controle de visibilidade
  - `.stat-card`: Cards de estatísticas responsivos
  - `.status-badge`: Badges de status coloridos
  - `.modal`: Sistema de modais avançado
  - Responsividade completa para mobile

## 💾 Banco de Dados {#banco-de-dados}

### Tabelas Principais

#### usuarios
```sql
- id (PK)
- nome (UNIQUE) - Nome de usuário
- senha_hash - Senha criptografada
- criado_em - Timestamp de criação
```

#### aihs
```sql
- id (PK)
- numero_aih (UNIQUE) - Número único da AIH
- valor_inicial - Valor inicial da AIH
- valor_atual - Valor atual após movimentações
- status (1-4) - Status da AIH
- competencia - Competência (MM/YYYY)
- criado_em - Timestamp de criação
- usuario_cadastro_id (FK) - Usuário que cadastrou
```

#### atendimentos
```sql
- id (PK)
- aih_id (FK) - Referência à AIH
- numero_atendimento - Número do atendimento
```

#### movimentacoes
```sql
- id (PK)
- aih_id (FK) - Referência à AIH
- tipo - Tipo de movimentação (entrada_sus/saida_hospital)
- data_movimentacao - Data da movimentação
- usuario_id (FK) - Usuário responsável
- valor_conta - Valor da conta
- competencia - Competência da movimentação
- prof_medicina - Profissional de medicina
- prof_enfermagem - Profissional de enfermagem
- prof_fisioterapia - Profissional de fisioterapia
- prof_bucomaxilo - Profissional bucomaxilo
- status_aih - Status da AIH na movimentação
```

#### glosas
```sql
- id (PK)
- aih_id (FK) - Referência à AIH
- linha - Linha da glosa
- tipo - Tipo da glosa
- profissional - Profissional responsável
- quantidade - Quantidade (se aplicável)
- ativa - Se a glosa está ativa
- criado_em - Timestamp de criação
```

#### tipos_glosa
```sql
- id (PK)
- descricao (UNIQUE) - Descrição do tipo de glosa
```

#### profissionais
```sql
- id (PK)
- nome - Nome do profissional
- especialidade - Especialidade
```

#### logs_acesso
```sql
- id (PK)
- usuario_id (FK) - Usuário que fez a ação
- acao - Descrição da ação
- data_hora - Timestamp da ação
- detalhes - Detalhes adicionais (JSON)
```

### Status da AIH
1. **Finalizada com aprovação direta** - Aprovada por ambas auditorias
2. **Ativa com aprovação indireta** - Glosa pela auditoria do SUS
3. **Ativa em discussão** - Glosa em discussão entre auditorias (padrão)
4. **Finalizada após discussão** - Aprovada após resolver glosas

### Índices para Performance
```sql
CREATE INDEX idx_aih_numero ON aihs(numero_aih);
CREATE INDEX idx_aih_status ON aihs(status);
CREATE INDEX idx_aih_competencia ON aihs(competencia);
CREATE INDEX idx_movimentacoes_aih ON movimentacoes(aih_id);
CREATE INDEX idx_movimentacoes_data ON movimentacoes(data_movimentacao);
CREATE INDEX idx_atendimentos_aih ON atendimentos(aih_id);
CREATE INDEX idx_glosas_aih ON glosas(aih_id);
CREATE INDEX idx_glosas_ativa ON glosas(ativa);
CREATE INDEX idx_logs_usuario ON logs_acesso(usuario_id);
CREATE INDEX idx_logs_data ON logs_acesso(data_hora);
```

## 🌐 API e Rotas {#api-e-rotas}

### Autenticação
- `POST /api/login` - Login com validações
- `POST /api/cadastrar` - Criar usuário (requer admin)
- `GET /api/usuarios` - Listar usuários (admin)
- `DELETE /api/usuarios/:id` - Remover usuário (admin)

### AIH
- `GET /api/dashboard` - Estatísticas do dashboard
- `GET /api/aih/:numero` - Buscar AIH por número
- `POST /api/aih` - Cadastrar nova AIH
- `POST /api/aih/:id/movimentacao` - Nova movimentação
- `DELETE /api/aih/:numero` - Excluir AIH (com justificativa)

### Movimentações
- `GET /api/movimentacoes/:aihId` - Listar movimentações
- `DELETE /api/movimentacoes/:id` - Excluir movimentação (com justificativa)

### Glosas
- `GET /api/aih/:id/glosas` - Listar glosas da AIH
- `POST /api/aih/:id/glosas` - Adicionar glosa
- `DELETE /api/glosas/:id` - Remover glosa
- `GET /api/tipos-glosa` - Listar tipos de glosa
- `POST /api/tipos-glosa` - Adicionar tipo de glosa
- `DELETE /api/tipos-glosa/:id` - Remover tipo de glosa

### Profissionais
- `GET /api/profissionais` - Listar profissionais
- `POST /api/profissionais` - Adicionar profissional
- `DELETE /api/profissionais/:id` - Remover profissional

### Pesquisa e Exportação
- `POST /api/pesquisar` - Pesquisa avançada com filtros
- `GET /api/export/:formato` - Exportar dados (csv/excel/json)
- `POST /api/export/:formato` - Exportar com filtros personalizados

### Backup e Manutenção
- `GET /api/backup` - Download do banco de dados
- `POST /api/backup/create` - Criar backup manual
- `GET /api/system/status` - Status do sistema
- `POST /api/system/cleanup` - Executar limpeza

### Relatórios Avançados
- `GET /api/relatorios/:tipo` - Gerar relatório
- `POST /api/relatorios/:tipo/export` - Exportar relatório
- **Tipos disponíveis**:
  - `acessos` - Relatório de acessos dos usuários
  - `glosas-profissional` - Glosas por profissional
  - `aihs-profissional` - AIHs por profissional auditor
  - `aprovacoes` - Relatório de aprovações
  - `tipos-glosa` - Análise por tipos de glosa
  - `analise-preditiva` - Análise preditiva de tendências
  - `produtividade-auditores` - Produtividade dos auditores
  - `detalhamento-status` - Detalhamento por status
  - `estatisticas-periodo` - Estatísticas gerais do período
  - `analise-temporal-cadastros` - Análise temporal de cadastros
  - `ranking-glosas-frequentes` - Ranking de glosas mais frequentes
  - `analise-valores-glosas` - Análise de valores das glosas

## 🎨 Frontend {#frontend}

### Fluxo de Navegação
```
Login → Principal → Informar AIH → Cadastro/Info AIH → Movimentação → Pendências
                 ↓
                 → Pesquisar
                 → Configurações
                 → Relatórios
                 → Gestão Usuários (admin)
                 → Alteração BD (exclusões)
                 → Backup/Exportar
```

### Estado da Aplicação
```javascript
state = {
    token: String,           // JWT token
    usuario: String,         // Nome do usuário
    aihAtual: Object,        // AIH sendo editada
    telaAnterior: String,    // Para navegação
    glosasPendentes: Array   // Glosas temporárias
}
```

## 🚀 Sistema de Cache e Performance {#cache-performance}

### Cache em Memória
- **queryCache**: Cache de consultas SQL (5 min TTL)
- **reportCache**: Cache de relatórios (15 min TTL)
- **dashboardCache**: Cache do dashboard (2 min TTL)

### Otimizações
- Connection pooling (25 conexões simultâneas)
- Compressão gzip em todas as respostas
- Rate limiting (100 req/min por IP)
- Índices otimizados no banco
- Paginação automática em listagens grandes

## 📊 Monitoramento e Logs {#monitoramento}

### Métricas Coletadas
- Total de AIHs, movimentações, glosas
- Tamanho do banco de dados
- Performance de consultas
- Estatísticas de uso por usuário

### Logs de Auditoria
- Todos os logins e ações dos usuários
- Exclusões com justificativas
- Alterações em configurações
- Erros e exceções

## 💾 Backup e Arquivamento {#backup-arquivamento}

### Backup Automático
- Backup diário automático
- Rotação de backups (manter últimos 30 dias)
- Backup incremental para economizar espaço

### Arquivamento
- Arquivamento automático de dados > 10 anos
- Compressão de dados históricos
- Limpeza automática de logs antigos

## 🚀 Como Adicionar Novas Funcionalidades {#novas-funcionalidades}

### 1. Adicionar Nova Tabela no Banco
**Em database.js**, na função `initDB()`:
```javascript
db.run(`CREATE TABLE IF NOT EXISTS nova_tabela (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campo1 TEXT NOT NULL,
    campo2 INTEGER DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Adicionar índices se necessário
db.run(`CREATE INDEX IF NOT EXISTS idx_nova_tabela_campo1 ON nova_tabela(campo1)`);
```

### 2. Criar Nova Rota na API
**Em server.js**:
```javascript
app.get('/api/nova-rota', verificarToken, async (req, res) => {
    try {
        const dados = await all('SELECT * FROM nova_tabela ORDER BY criado_em DESC');
        res.json({ dados });
    } catch (err) {
        console.error('Erro na nova rota:', err);
        res.status(500).json({ error: err.message });
    }
});
```

### 3. Adicionar Nova Tela
**Em index.html**:
```html
<div id="telaNova" class="tela">
    <header>
        <button class="btn-voltar" onclick="voltarTelaPrincipal()">← Voltar</button>
        <h2>Nova Funcionalidade</h2>
    </header>
    <div class="container">
        <!-- Conteúdo da tela -->
    </div>
</div>
```

### 4. Adicionar Lógica no Frontend
**Em app.js**:
```javascript
// Adicionar botão no menu
document.getElementById('btnNovaFuncao').addEventListener('click', () => {
    mostrarTela('telaNova');
    carregarDadosNovaTela();
});

// Função para carregar dados com cache
const carregarDadosNovaTela = async () => {
    try {
        const response = await api('/nova-rota');
        // Processar e exibir dados
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao carregar dados: ' + err.message);
    }
};
```

## 📏 Padrões e Convenções {#padrões}

### Nomenclatura
- **Tabelas**: snake_case plural (ex: `tipos_glosa`)
- **Colunas**: snake_case (ex: `numero_aih`)
- **Rotas API**: kebab-case (ex: `/api/tipos-glosa`)
- **IDs HTML**: camelCase (ex: `btnNovaFuncao`)
- **Funções JS**: camelCase (ex: `carregarDados`)

### Estrutura de Resposta da API
```javascript
// Sucesso
{ success: true, data: {...} }

// Erro
{ error: "Mensagem de erro" }

// Lista
{ items: [...], total: 10 }

// Relatório
{ dados: [...], metadados: {...} }
```

### Validações
- Sempre validar no frontend E backend
- Usar try/catch em funções assíncronas
- Retornar mensagens de erro claras e específicas
- Logs de auditoria para todas as operações críticas

### Segurança
- Todas rotas (exceto login) protegidas por JWT
- Senhas hasheadas com bcrypt (salt rounds: 10)
- Rate limiting por IP
- Headers de segurança com helmet
- Sanitização de inputs
- Logs de todas as ações sensíveis

## 🛠️ Comandos Úteis {#comandos}

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Iniciar servidor em produção
npm start

# Desenvolvimento com auto-reload
npm run dev

# Verificar status do servidor
ps aux | grep "node server.js"
```

### Manutenção
```bash
# Backup manual do banco
cp db/aih.db "db/backup-$(date +%Y%m%d-%H%M%S).db"

# Verificar tamanho do banco
ls -lh db/aih.db

# Otimizar banco (VACUUM)
sqlite3 db/aih.db "VACUUM;"

# Ver logs do servidor
tail -f nohup.out
```

### Debug e Monitoramento
```javascript
// Ver queries SQL no console
db.on('trace', (sql) => console.log('SQL:', sql));

// Log de todas as requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Verificar cache
console.log('Cache size:', queryCache.size);
```

## 📝 Checklist para Nova Funcionalidade

- [ ] Definir requisitos e impacto na performance
- [ ] Criar/alterar tabelas com índices apropriados
- [ ] Implementar rotas da API com validações
- [ ] Adicionar cache onde apropriado
- [ ] Testar API com diferentes cenários
- [ ] Criar interface HTML responsiva
- [ ] Implementar lógica JavaScript otimizada
- [ ] Adicionar estilos CSS consistentes
- [ ] Testar fluxo completo em diferentes dispositivos
- [ ] Adicionar logs de auditoria
- [ ] Documentar alterações
- [ ] Criar testes de carga se necessário
- [ ] Verificar impacto no backup/arquivamento

## 🔍 Dicas para Desenvolvimento Futuro

1. **Performance**: Sempre considere o impacto de consultas em grandes volumes
2. **Cache**: Use cache para consultas frequentes, mas mantenha consistência
3. **Logs**: Registre todas as operações críticas para auditoria
4. **Validação**: Valide tanto no frontend quanto no backend
5. **Backup**: Teste regularmente os procedimentos de backup/restore
6. **Monitoramento**: Implemente métricas para novas funcionalidades
7. **Segurança**: Considere sempre o princípio do menor privilégio
8. **Documentação**: Mantenha a documentação atualizada

## 📞 Arquitetura de Comunicação

```
Frontend (SPA) → Middleware → API Routes → Database Layer → SQLite
     ↓              ↓            ↓            ↓
   Cache         Security    Validation    Cache/Pool
   Estado        Rate Limit  Sanitização   Índices
   Validação     Logs        Business Logic Backup
```

## 🎯 Métricas de Performance Atuais

- **Consultas**: < 100ms para consultas simples
- **Dashboard**: < 500ms para carregamento completo
- **Cache Hit Rate**: > 80% para consultas frequentes
- **Concurrent Users**: Suporta até 25 usuários simultâneos
- **Database Size**: Otimizado para crescimento linear
- **Backup Time**: < 30 segundos para backup completo

Este documento deve ser atualizado sempre que novas funcionalidades forem adicionadas ao sistema.
