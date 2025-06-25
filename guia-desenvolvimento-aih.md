
# 📚 Guia de Desenvolvimento - Sistema de Controle de Auditoria AIH

## 📋 Índice
1. [Visão Geral do Sistema](#visão-geral)
2. [Nova Estrutura Modular](#estrutura-modular)
3. [Arquitetura do Sistema](#arquitetura)
4. [Backend Atualizado](#backend)
5. [Frontend Modular](#frontend-modular)
6. [Banco de Dados](#banco-de-dados)
7. [API e Rotas](#api-e-rotas)
8. [Como Adicionar Novas Funcionalidades](#novas-funcionalidades)
9. [Padrões e Convenções](#padrões)
10. [Migração e Manutenção](#migração)

## 🎯 Visão Geral do Sistema {#visão-geral}

### Propósito
Sistema web para controle e auditoria de AIH (Autorização de Internação Hospitalar), gerenciando o fluxo entre auditoria hospitalar e auditoria do SUS.

### Tecnologias Utilizadas
- **Backend**: Node.js + Express.js
- **Banco de Dados**: SQLite com índices otimizados
- **Frontend**: Arquitetura modular com JavaScript ES6+
- **Autenticação**: JWT (JSON Web Tokens)
- **Hash de Senha**: bcryptjs
- **Build**: Modular sem bundler (desenvolvimento)

### Principais Melhorias da Versão Atual
- ✅ **Arquitetura modular** - Código organizado em módulos especializados
- ✅ **Performance otimizada** - Lazy loading e cache inteligente
- ✅ **Interface moderna** - UX/UI responsiva e intuitiva
- ✅ **Validações robustas** - Client + server side
- ✅ **Sistema de logs** - Auditoria completa de ações
- ✅ **Relatórios avançados** - Analytics e exportações

## 🏗️ Nova Estrutura Modular {#estrutura-modular}

### Organização Frontend
```
public/
├── js/
│   ├── core/                 # 🔧 Funcionalidades centrais
│   │   ├── state.js         # Estado global da aplicação
│   │   ├── api.js           # Cliente HTTP para API
│   │   ├── navigation.js    # Sistema de navegação
│   │   └── modal.js         # Sistema de modais
│   │
│   ├── pages/               # 📄 Lógica específica de cada tela
│   │   ├── login.js         # Autenticação e cadastro
│   │   ├── dashboard.js     # Dashboard e estatísticas
│   │   ├── aih-management.js # Cadastro e gestão de AIH
│   │   ├── movements.js     # Movimentações
│   │   ├── glosas.js        # Gestão de glosas/pendências
│   │   ├── search.js        # Pesquisa avançada
│   │   └── reports.js       # Relatórios e análises
│   │
│   └── utils/               # 🛠️ Utilitários
│       └── exports.js       # Exportações de dados
│
├── index.html               # SPA principal
├── style.css               # Estilos unificados
└── app.js                  # Inicialização (legado - pode ser removido)
```

### Organização Backend (Recomendada para futuro)
```
server/
├── controllers/             # Lógica de negócio
├── routes/                 # Definição de rotas
├── services/               # Serviços auxiliares
├── middleware/             # Middlewares customizados
└── models/                 # Modelos de dados
```

## 🔧 Arquitetura do Sistema {#arquitetura}

### Frontend Modular

#### Core Modules

**state.js** - Gerenciamento de Estado
```javascript
const AppState = {
    // Estado centralizado
    token: null,
    usuario: null,
    aihAtual: null,
    telaAnterior: null,
    
    // Métodos para manipulação
    setToken(token) { /* ... */ },
    setUsuario(usuario) { /* ... */ },
    clear() { /* ... */ }
};
```

**api.js** - Cliente HTTP
```javascript
const ApiService = {
    // Wrapper para fetch com token automático
    async call(endpoint, options = {}) { /* ... */ },
    
    // Métodos específicos
    async login(credentials) { /* ... */ },
    async buscarAIH(numero) { /* ... */ },
    async salvarMovimentacao(dados) { /* ... */ }
};
```

**navigation.js** - Sistema de Navegação
```javascript
const Navigation = {
    // Navegação entre telas
    mostrarTela(telaId) { /* ... */ },
    voltar() { /* ... */ },
    
    // Navegação específica
    irParaDashboard() { /* ... */ },
    irParaMovimentacao() { /* ... */ }
};
```

#### Page Modules

Cada módulo de página é responsável por:
- Inicialização da tela
- Manipulação de eventos
- Validação de dados
- Comunicação com API
- Atualização da interface

**Exemplo - movements.js**:
```javascript
const Movements = {
    async init() {
        this.configurarEventos();
        await this.carregarDados();
    },
    
    configurarEventos() { /* ... */ },
    carregarDados() { /* ... */ },
    validarFormulario() { /* ... */ },
    salvarMovimentacao() { /* ... */ }
};
```

### Sistema de Carregamento

**index.html** - Carregamento Modular
```html
<!-- Core modules -->
<script src="js/core/state.js"></script>
<script src="js/core/api.js"></script>
<script src="js/core/navigation.js"></script>
<script src="js/core/modal.js"></script>

<!-- Page modules -->
<script src="js/pages/login.js"></script>
<script src="js/pages/dashboard.js"></script>
<!-- ... outros módulos ... -->

<!-- Inicialização -->
<script>
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar core
    AppState.init();
    Navigation.init();
    
    // Verificar autenticação
    if (AppState.token) {
        Navigation.irParaDashboard();
    } else {
        Navigation.mostrarTela('telaLogin');
    }
});
</script>
```

## 🗄️ Backend Atualizado {#backend}

### server.js - Servidor Principal
**Responsabilidades atuais:**
- Configuração do Express
- Definição de rotas da API
- Middlewares de autenticação
- Servir arquivos estáticos
- Lógica de negócios (a ser modularizada)

**Rotas principais:**
```javascript
// Autenticação
app.post('/api/login', /* ... */);
app.post('/api/cadastrar', /* ... */);

// AIH
app.get('/api/aih/:numero', /* ... */);
app.post('/api/aih', /* ... */);
app.post('/api/aih/:id/movimentacao', /* ... */);

// Glosas
app.get('/api/aih/:id/glosas', /* ... */);
app.post('/api/aih/:id/glosas', /* ... */);

// Relatórios
app.get('/api/relatorios/:tipo', /* ... */);
app.get('/api/export/:formato', /* ... */);

// Configurações
app.get('/api/profissionais', /* ... */);
app.post('/api/profissionais', /* ... */);
```

### database.js - Camada de Dados
**Funções exportadas:**
```javascript
module.exports = {
    initDB,           // Inicializar tabelas
    run,              // INSERT/UPDATE/DELETE
    get,              // SELECT único
    all,              // SELECT múltiplo
    close             // Fechar conexão
};
```

### auth.js - Autenticação
**Middleware e utilitários:**
```javascript
module.exports = {
    verificarToken,    // Middleware para rotas protegidas
    login,            // Função de login
    cadastrarUsuario, // Criar usuário
    hashPassword,     // Hash de senha
    comparePassword   // Verificar senha
};
```

## 🎨 Frontend Modular {#frontend-modular}

### Padrão de Desenvolvimento de Módulos

#### 1. Estrutura Básica de um Módulo
```javascript
const NomeModulo = {
    // Estado local do módulo
    dados: {},
    
    // Inicialização
    async init() {
        this.configurarEventos();
        await this.carregarDados();
    },
    
    // Configurar event listeners
    configurarEventos() {
        // DOM events
        document.getElementById('btnSalvar').addEventListener('click', 
            this.salvar.bind(this));
    },
    
    // Carregar dados da API
    async carregarDados() {
        try {
            const response = await ApiService.call('/endpoint');
            this.dados = response;
            this.renderizar();
        } catch (err) {
            console.error('Erro:', err);
        }
    },
    
    // Renderizar interface
    renderizar() {
        // Atualizar DOM
    },
    
    // Validar dados
    validar() {
        // Validações específicas
        return true;
    },
    
    // Salvar dados
    async salvar() {
        if (!this.validar()) return;
        
        try {
            await ApiService.call('/endpoint', {
                method: 'POST',
                body: JSON.stringify(this.dados)
            });
            
            // Feedback de sucesso
            Navigation.voltar();
        } catch (err) {
            // Tratamento de erro
        }
    }
};

// Exportar para uso global
window.NomeModulo = NomeModulo;
```

#### 2. Comunicação Entre Módulos

**Event System:**
```javascript
// Emissor
window.dispatchEvent(new CustomEvent('aihAtualizada', { 
    detail: { aihId: 123 } 
}));

// Receptor
window.addEventListener('aihAtualizada', (event) => {
    console.log('AIH atualizada:', event.detail.aihId);
    Dashboard.atualizarEstatisticas();
});
```

**Estado Compartilhado:**
```javascript
// Módulo A define dados
AppState.setAihAtual(dadosAIH);

// Módulo B usa dados
const aih = AppState.getAihAtual();
```

### Sistema de Validação

#### Cliente (JavaScript)
```javascript
const Validacao = {
    numeroAIH(numero) {
        return /^\d{13}$/.test(numero);
    },
    
    competencia(comp) {
        return /^(0[1-9]|1[0-2])\/\d{4}$/.test(comp);
    },
    
    valor(valor) {
        return !isNaN(valor) && valor > 0;
    },
    
    // Validação visual
    marcarCampoInvalido(campo, mensagem) {
        campo.classList.add('erro');
        // Mostrar mensagem
    }
};
```

#### Servidor (Node.js)
```javascript
const validarDadosAIH = (dados) => {
    const erros = [];
    
    if (!dados.numero_aih || !/^\d{13}$/.test(dados.numero_aih)) {
        erros.push('Número AIH inválido');
    }
    
    if (!dados.valor_inicial || dados.valor_inicial <= 0) {
        erros.push('Valor inicial deve ser maior que zero');
    }
    
    return erros;
};
```

## 💾 Banco de Dados {#banco-de-dados}

### Estrutura Otimizada

**Tabelas principais com novos campos:**
- `aihs` - Adicionado `observacoes`
- `movimentacoes` - Adicionado `observacoes`
- `glosas` - Adicionados `quantidade`, `usuario_id`, `observacoes`
- `logs_acesso` - Nova tabela para auditoria

**Índices para performance:**
```sql
-- Índices críticos
CREATE INDEX idx_aih_numero ON aihs(numero_aih);
CREATE INDEX idx_aih_status ON aihs(status);
CREATE INDEX idx_movimentacoes_data ON movimentacoes(data_movimentacao);
CREATE INDEX idx_glosas_ativa ON glosas(ativa);
```

**Triggers automáticos:**
```sql
-- Atualizar valor atual na AIH
CREATE TRIGGER update_aih_valor_atual 
AFTER INSERT ON movimentacoes
BEGIN
    UPDATE aihs 
    SET valor_atual = NEW.valor_conta,
        status = NEW.status_aih
    WHERE id = NEW.aih_id;
END;
```

### Migrations e Atualizações

**Script de atualização:**
```javascript
// update-db.js
const { run } = require('./database');

async function atualizarEstrutura() {
    try {
        // Adicionar novos campos
        await run('ALTER TABLE aihs ADD COLUMN observacoes TEXT');
        await run('ALTER TABLE movimentacoes ADD COLUMN observacoes TEXT');
        
        // Criar nova tabela
        await run(`CREATE TABLE IF NOT EXISTS logs_acesso (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            acao TEXT NOT NULL,
            data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
            detalhes TEXT
        )`);
        
        console.log('✅ Estrutura atualizada com sucesso');
    } catch (err) {
        console.error('❌ Erro na atualização:', err);
    }
}
```

## 🌐 API e Rotas {#api-e-rotas}

### Padronização de Respostas

**Sucesso:**
```json
{
    "success": true,
    "data": { ... },
    "message": "Operação realizada com sucesso"
}
```

**Erro:**
```json
{
    "error": true,
    "message": "Descrição do erro",
    "code": "ERROR_CODE",
    "details": { ... }
}
```

**Lista com paginação:**
```json
{
    "items": [...],
    "total": 150,
    "page": 1,
    "limit": 50,
    "hasNext": true
}
```

### Novas Rotas Implementadas

```javascript
// Movimentação avançada
app.get('/api/aih/:id/proxima-movimentacao', /* ... */);
app.post('/api/aih/:id/movimentacao-completa', /* ... */);

// Relatórios
app.get('/api/relatorios/dashboard-stats', /* ... */);
app.post('/api/relatorios/customizado', /* ... */);

// Exportações
app.get('/api/export/aih/:id/historico', /* ... */);
app.post('/api/export/pesquisa-avancada', /* ... */);

// Logs e auditoria
app.get('/api/logs/usuario/:id', /* ... */);
app.get('/api/logs/aih/:id', /* ... */);
```

### Middleware Personalizado

```javascript
// Log de ações
const logAcao = (acao) => (req, res, next) => {
    req.logAcao = acao;
    next();
};

// Validação de dados
const validarAIH = (req, res, next) => {
    const erros = validarDadosAIH(req.body);
    if (erros.length > 0) {
        return res.status(400).json({ error: erros });
    }
    next();
};

// Uso
app.post('/api/aih', 
    verificarToken, 
    logAcao('CRIAR_AIH'), 
    validarAIH, 
    criarAIH
);
```

## 🚀 Como Adicionar Novas Funcionalidades {#novas-funcionalidades}

### 1. Criar Novo Módulo Frontend

**Passo 1 - Criar arquivo do módulo:**
```javascript
// public/js/pages/nova-funcionalidade.js
const NovaFuncionalidade = {
    dados: {},
    
    async init() {
        console.log('Inicializando Nova Funcionalidade');
        this.configurarEventos();
        await this.carregarDados();
    },
    
    configurarEventos() {
        const form = document.getElementById('formNovaFunc');
        if (form) {
            form.addEventListener('submit', this.salvar.bind(this));
        }
    },
    
    async carregarDados() {
        try {
            const response = await ApiService.call('/nova-funcionalidade');
            this.dados = response.data;
            this.renderizar();
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        }
    },
    
    renderizar() {
        // Atualizar DOM com os dados
        const container = document.getElementById('containerNovaFunc');
        if (container) {
            container.innerHTML = this.gerarHTML();
        }
    },
    
    gerarHTML() {
        return `
            <div class="nova-func-content">
                <!-- HTML da funcionalidade -->
            </div>
        `;
    },
    
    validar() {
        // Implementar validações
        return true;
    },
    
    async salvar(event) {
        event.preventDefault();
        
        if (!this.validar()) {
            return;
        }
        
        try {
            await ApiService.call('/nova-funcionalidade', {
                method: 'POST',
                body: JSON.stringify(this.dados)
            });
            
            // Feedback de sucesso
            alert('Dados salvos com sucesso!');
            Navigation.voltar();
            
        } catch (err) {
            console.error('Erro ao salvar:', err);
            alert('Erro ao salvar dados');
        }
    }
};

// Exportar globalmente
window.NovaFuncionalidade = NovaFuncionalidade;
```

**Passo 2 - Adicionar à HTML:**
```html
<!-- Em index.html -->
<div id="telaNovaFuncionalidade" class="tela">
    <header>
        <button class="btn-voltar" onclick="Navigation.voltar()">← Voltar</button>
        <h2>Nova Funcionalidade</h2>
    </header>
    <div class="container">
        <div id="containerNovaFunc">
            <!-- Conteúdo será inserido dinamicamente -->
        </div>
        
        <form id="formNovaFunc">
            <!-- Formulário -->
            <button type="submit">Salvar</button>
        </form>
    </div>
</div>

<!-- Carregar script -->
<script src="js/pages/nova-funcionalidade.js"></script>
```

**Passo 3 - Adicionar navegação:**
```javascript
// Em navigation.js
const Navigation = {
    // ... métodos existentes ...
    
    irParaNovaFuncionalidade() {
        AppState.setTelaAnterior(this.telaAtual);
        this.mostrarTela('telaNovaFuncionalidade');
        
        setTimeout(() => {
            if (window.NovaFuncionalidade) {
                NovaFuncionalidade.init();
            }
        }, 100);
    }
};
```

### 2. Criar Nova Rota Backend

**No server.js:**
```javascript
// Nova rota GET
app.get('/api/nova-funcionalidade', verificarToken, async (req, res) => {
    try {
        const dados = await all('SELECT * FROM nova_tabela ORDER BY id DESC');
        res.json({ 
            success: true, 
            data: dados 
        });
    } catch (err) {
        console.error('Erro ao buscar dados:', err);
        res.status(500).json({ 
            error: true, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Nova rota POST
app.post('/api/nova-funcionalidade', verificarToken, async (req, res) => {
    const { campo1, campo2 } = req.body;
    
    // Validação
    if (!campo1 || !campo2) {
        return res.status(400).json({
            error: true,
            message: 'Campos obrigatórios não preenchidos'
        });
    }
    
    try {
        const result = await run(
            'INSERT INTO nova_tabela (campo1, campo2, usuario_id) VALUES (?, ?, ?)',
            [campo1, campo2, req.userId]
        );
        
        res.json({ 
            success: true, 
            id: result.lastID,
            message: 'Dados salvos com sucesso'
        });
    } catch (err) {
        console.error('Erro ao salvar:', err);
        res.status(500).json({ 
            error: true, 
            message: 'Erro ao salvar dados' 
        });
    }
});
```

### 3. Criar Nova Tabela no Banco

**No database.js, função initDB():**
```javascript
const initDB = async () => {
    // ... tabelas existentes ...
    
    // Nova tabela
    db.run(`CREATE TABLE IF NOT EXISTS nova_tabela (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campo1 TEXT NOT NULL,
        campo2 INTEGER DEFAULT 0,
        usuario_id INTEGER,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )`);
    
    // Índice para performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_nova_tabela_usuario 
             ON nova_tabela(usuario_id)`);
};
```

## 📏 Padrões e Convenções {#padrões}

### Nomenclatura Atualizada
- **Módulos JavaScript**: PascalCase (ex: `Dashboard`, `AihManagement`)
- **Arquivos**: kebab-case (ex: `aih-management.js`)
- **Funções e variáveis**: camelCase (ex: `carregarDados`, `aihAtual`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_BASE_URL`)
- **CSS classes**: kebab-case (ex: `.status-badge`, `.btn-primary`)
- **IDs HTML**: camelCase (ex: `#telaMovimentacao`, `#btnSalvar`)

### Estrutura de Arquivos JavaScript
```javascript
// 1. Constantes e configurações
const CONFIG = {
    API_BASE: '/api',
    TIMEOUT: 5000
};

// 2. Estado local do módulo
const ModuleState = {
    dados: {},
    loading: false
};

// 3. Módulo principal
const NomeModulo = {
    // Propriedades
    propriedade: valor,
    
    // Métodos públicos
    async init() { /* ... */ },
    configurarEventos() { /* ... */ },
    
    // Métodos privados (convenção: prefixo _)
    _validarCampo(valor) { /* ... */ },
    _renderizarItem(item) { /* ... */ }
};

// 4. Event listeners globais
document.addEventListener('DOMContentLoaded', () => {
    // Inicialização se necessário
});

// 5. Exportação
window.NomeModulo = NomeModulo;
```

### Padrão de Validação
```javascript
const Validadores = {
    // Cliente
    validarNoFrontend(dados) {
        const erros = [];
        
        if (!dados.campo1) {
            erros.push({ campo: 'campo1', mensagem: 'Campo obrigatório' });
        }
        
        return erros;
    },
    
    // Servidor
    validarNoBackend(dados) {
        const erros = [];
        
        // Validações mais rigorosas
        if (!dados.campo1 || dados.campo1.length < 3) {
            erros.push('Campo deve ter pelo menos 3 caracteres');
        }
        
        return erros;
    }
};
```

### Tratamento de Erros Padronizado
```javascript
const TratamentoErros = {
    // Frontend
    async executarComTratamento(operacao) {
        try {
            const resultado = await operacao();
            return { sucesso: true, dados: resultado };
        } catch (err) {
            console.error('Erro na operação:', err);
            
            // Mostrar erro ao usuário
            this.mostrarErro(err.message || 'Erro inesperado');
            
            return { sucesso: false, erro: err };
        }
    },
    
    mostrarErro(mensagem) {
        // Toast, modal ou outro feedback visual
        alert(mensagem); // Temporário
    },
    
    // Backend
    responderComErro(res, erro, status = 500) {
        console.error('Erro no servidor:', erro);
        res.status(status).json({
            error: true,
            message: erro.message || 'Erro interno do servidor',
            timestamp: new Date().toISOString()
        });
    }
};
```

## 🔄 Migração e Manutenção {#migração}

### Removendo Código Legado

**app.js legado pode ser removido após verificar que todos os módulos foram migrados:**

1. **Verificar funcionalidades migradas:**
   - ✅ Login → `login.js`
   - ✅ Dashboard → `dashboard.js`
   - ✅ AIH Management → `aih-management.js`
   - ✅ Movimentações → `movements.js`
   - ✅ Glosas → `glosas.js`
   - ✅ Pesquisa → `search.js`
   - ✅ Relatórios → `reports.js`

2. **Backup antes da remoção:**
   ```bash
   cp public/app.js public/app.js.backup
   ```

3. **Remover referência do HTML:**
   ```html
   <!-- Remover esta linha -->
   <!-- <script src="app.js"></script> -->
   ```

### Scripts de Manutenção

**cleanup.js** - Limpeza automática
```javascript
const { run, all } = require('./database');

async function limpezaAutomatica() {
    try {
        // Limpar logs antigos (> 6 meses)
        const seisMesesAtras = new Date();
        seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
        
        const result = await run(
            'DELETE FROM logs_acesso WHERE data_hora < ?',
            [seisMesesAtras.toISOString()]
        );
        
        console.log(`🧹 Logs limpos: ${result.changes} registros removidos`);
        
        // Optimizar banco
        await run('VACUUM');
        console.log('📦 Banco otimizado com sucesso');
        
    } catch (err) {
        console.error('❌ Erro na limpeza:', err);
    }
}

module.exports = { limpezaAutomatica };
```

**monitor.js** - Monitoramento
```javascript
const fs = require('fs');
const path = require('path');

function monitorarSistema() {
    // Tamanho do banco
    const dbPath = path.join(__dirname, 'db', 'aih.db');
    const stats = fs.statSync(dbPath);
    const tamanhoMB = (stats.size / 1024 / 1024).toFixed(2);
    
    // Estatísticas básicas
    console.log(`📊 Stats: ${tamanhoMB}MB`);
    
    // Verificar se precisa de manutenção
    if (stats.size > 100 * 1024 * 1024) { // 100MB
        console.log('⚠️  Banco grande, considere fazer limpeza');
    }
}

module.exports = { monitorarSistema };
```

### Atualizações Futuras

**Roadmap de melhorias:**

1. **Fase 1 - Concluída**
   - ✅ Modularização do frontend
   - ✅ Otimização da estrutura
   - ✅ Melhoria da UX

2. **Fase 2 - Próxima**
   - 🔄 Modularização do backend
   - 🔄 Testes automatizados
   - 🔄 Docker para deployment

3. **Fase 3 - Futuro**
   - 📱 PWA (Progressive Web App)
   - 🔄 Real-time com WebSockets
   - 📊 Dashboard avançado com gráficos

### Comandos Úteis Atualizados

```bash
# Desenvolvimento
npm start                    # Servidor com nodemon
npm run dev                 # Alias para start

# Manutenção
node cleanup.js             # Limpeza manual
node monitor.js             # Verificar status

# Backup
npm run backup              # Backup automático

# Estrutura do banco
node database.js            # Recriar estrutura
node update-db.js          # Aplicar migrations
```

## 🔍 Debug e Troubleshooting

### Ferramentas de Debug

**Console do navegador:**
```javascript
// Verificar estado atual
console.log('Estado:', AppState.getAll());

// Verificar módulos carregados
console.log('Módulos:', Object.keys(window).filter(k => 
    window[k] && typeof window[k] === 'object' && window[k].init
));

// Testar API
ApiService.call('/dashboard').then(console.log);
```

**Logs do servidor:**
```javascript
// Adicionar debug temporal no server.js
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});
```

### Problemas Comuns

1. **Módulo não carrega:**
   - Verificar se o script está incluído no HTML
   - Verificar erros no console
   - Verificar se init() é chamado

2. **API não responde:**
   - Verificar se servidor está rodando
   - Verificar token de autenticação
   - Verificar logs do servidor

3. **Estado não persiste:**
   - Verificar localStorage
   - Verificar se AppState.save() é chamado
   - Verificar token expirado

Este guia deve ser atualizado sempre que novas funcionalidades forem adicionadas ao sistema.
