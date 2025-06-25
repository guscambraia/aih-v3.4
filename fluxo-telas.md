
# Fluxo de Telas - Sistema AIH (Estrutura Modular)

## Arquitetura Frontend

### Estrutura de Arquivos
```
public/
├── js/
│   ├── core/           # Funcionalidades centrais
│   │   ├── state.js    # Gerenciamento de estado
│   │   ├── api.js      # Comunicação com API
│   │   ├── navigation.js # Navegação entre telas
│   │   └── modal.js    # Sistema de modais
│   ├── pages/          # Lógica de cada tela
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── aih-management.js
│   │   ├── movements.js
│   │   ├── glosas.js
│   │   ├── search.js
│   │   └── reports.js
│   └── utils/          # Utilitários
│       └── exports.js
├── index.html          # SPA principal
├── style.css          # Estilos
└── app.js             # Inicialização (legado)
```

## 1. TELA LOGIN (`login.js`)
**Campos:**
- Usuário (input texto)
- Senha (input password)
- Botão Login
- Link "Cadastrar novo usuário"

**Funcionalidades:**
- Validação de credenciais
- Armazenamento de token JWT
- Modal de cadastro de usuário

**Ações:**
- Login bem-sucedido → TELA PRINCIPAL
- Cadastro → Modal de cadastro

## 2. TELA PRINCIPAL (`dashboard.js`)
**Seções:**
- **Dashboard com estatísticas**
  - Total de AIH cadastradas
  - AIH em processamento
  - Distribuição por status
  - Resumo financeiro
  - Seletor de competência

**Menu Principal:**
- 📝 Informar AIH
- 🔍 Buscar AIH
- 💾 Backup/Exportar
- ⚙️ Configurações
- 📊 Relatórios

**Funcionalidades:**
- Auto-refresh das estatísticas
- Filtro por competência
- Cards interativos com animações

## 3. TELA INFORMAR AIH (`aih-management.js`)
**Campo:**
- Número da AIH (input com validação)
- Botão Buscar

**Fluxo Inteligente:**
- AIH não existe → TELA CADASTRO AIH
- AIH existe (status 1 ou 4) → Confirmação de reassinatura
  - Sim → TELA INFORMAÇÕES AIH
  - Não → Cancela operação
- AIH existe (status 2 ou 3) → TELA INFORMAÇÕES AIH

## 4. TELA CADASTRO AIH (`aih-management.js`)
**Campos obrigatórios:**
- Número AIH (único no sistema)
- Números de atendimento (múltiplos, separados por vírgula)
- Competência (MM/YYYY com validação)
- Valor inicial (formato monetário)

**Validações:**
- Número AIH único
- Formato de competência válido
- Valor inicial > 0
- Pelo menos um atendimento

**Ação:**
- Cadastro bem-sucedido → TELA INFORMAÇÕES AIH

## 5. TELA INFORMAÇÕES AIH (`aih-management.js`)
**Exibe:**
- **Dados da AIH**
  - Número, atendimentos, valores
  - Status atual com badge colorido
  - Competência
- **Histórico de movimentações** (tabela responsiva)
  - Data, tipo, status, valor, profissionais
  - Botão exportar Excel
- **Glosas ativas** (se houver)
- **Botão "Nova Movimentação"**

**Funcionalidades:**
- Exportação do histórico
- Visualização de glosas
- Status colorido e descritivo

## 6. TELA MOVIMENTAÇÃO (`movements.js`)
**Interface Moderna:**
- **Tipo de movimentação** (automaticamente definido)
- **Status atual** (select com guia visual)
- **Data** (preenchida automaticamente)
- **Competência** (editável, pré-preenchida)
- **Profissionais** (4 campos com sugestões)
- **Valor atual da conta** (editável)

**Seção Glosas/Pendências:**
- Lista de glosas ativas
- Contador de pendências
- Botão "Gerenciar Glosas"

**Funcionalidades:**
- Pré-seleção de profissionais (baseado na última movimentação)
- Validação de campos obrigatórios
- Guia visual de status
- Sugestões inteligentes

**Ações:**
- Gerenciar Glosas → TELA PENDÊNCIAS
- Salvar → Volta para TELA INFORMAÇÕES AIH

## 7. TELA PENDÊNCIAS (`glosas.js`)
**Funcionalidades:**
- **Lista de glosas atuais** (editável)
- **Adicionar nova glosa:**
  - Linha da glosa
  - Tipo da glosa (select carregado dinamicamente)
  - Profissional responsável
  - Quantidade
  - Observações
- **Ações em lote:**
  - Marcar como resolvida
  - Excluir múltiplas
- **Filtros** (ativas/resolvidas)

**Interface:**
- Cards para cada glosa
- Drag & drop para reordenar
- Modal para edição
- Confirmação antes de excluir

## 8. TELA PESQUISA (`search.js`)
**Filtros Avançados:**
- **Status** (múltipla escolha com checkboxes)
- **Período** (data início/fim com datepicker)
- **Competência** (MM/YYYY)
- **Profissional auditor** (select carregado)
- **Valor** (faixa mínimo/máximo)
- **Busca rápida** (por número AIH ou atendimento)

**Resultados:**
- Tabela responsiva com paginação
- Ordenação por colunas
- Ações em linha (visualizar, editar)
- **Exportações:** CSV, Excel, JSON

**Funcionalidades:**
- Pesquisa em tempo real
- Salvamento de filtros
- Histórico de pesquisas

## 9. TELA CONFIGURAÇÕES
**Seções modulares:**

### Gerenciar Profissionais
- Lista com filtros por especialidade
- Formulário de adição
- Edição inline
- Validação de duplicatas

### Gerenciar Tipos de Glosa
- Lista editável
- Adição de novos tipos
- Uso em relatórios

### Gerenciar Usuários (apenas admin)
- Lista de usuários
- Reset de senhas
- Níveis de acesso

### Backup e Manutenção
- Download do banco
- Limpeza de logs antigos
- Estatísticas do sistema

## 10. TELA RELATÓRIOS (`reports.js`)
**Filtros de Período:**
- Data início/fim
- Competência específica
- Botão "Limpar Filtros"

**Tipos de Relatórios:**
1. **📈 Relatório de Acessos**
2. **👨‍⚕️ Glosas por Profissional**
3. **📋 AIHs por Profissional**
4. **✅ Análise de Aprovações**
5. **📊 Tipos de Glosa Mais Comuns**
6. **🔮 Análise Preditiva**

**Funcionalidades:**
- Gráficos interativos
- Exportação em múltiplos formatos
- Drill-down nos dados
- Agendamento de relatórios

## Navegação e Estado

### Fluxo Principal
```
LOGIN → PRINCIPAL → INFORMAR AIH → CADASTRO/INFO AIH → MOVIMENTAÇÃO → PENDÊNCIAS
                 ↓
                 → PESQUISAR
                 → CONFIGURAÇÕES  
                 → RELATÓRIOS
```

### Gerenciamento de Estado (`state.js`)
```javascript
AppState = {
    token: String,        // JWT token
    usuario: Object,      // Dados do usuário logado
    aihAtual: Object,     // AIH sendo editada
    telaAnterior: String, // Para navegação de volta
    glosasPendentes: Array, // Glosas temporárias
    filtrosPesquisa: Object, // Filtros salvos
    competenciaAtual: String // Competência selecionada
}
```

### Sistema de Navegação (`navigation.js`)
- Histórico de navegação
- Breadcrumbs automáticos
- Validação antes de sair de telas com dados não salvos
- Deep linking para bookmarks

## Funcionalidades Transversais

### Validações
- Cliente-side com feedback visual
- Server-side para segurança
- Mensagens de erro contextuais

### Responsividade
- Design mobile-first
- Breakpoints: 768px, 1024px, 1200px
- Menu colapsável em mobile
- Tabelas com scroll horizontal

### Performance
- Lazy loading de módulos
- Cache de dados frequentes
- Debounce em pesquisas
- Paginação automática

### Acessibilidade
- Navegação por teclado
- Screen reader friendly
- Alto contraste
- Textos alternativos

## Padrões de Interação

### Feedback Visual
- Loading states
- Toasts para notificações
- Modais para confirmações
- Badges para status

### Atalhos de Teclado
- Ctrl+S: Salvar
- Esc: Cancelar/Voltar
- Ctrl+F: Pesquisar
- F5: Atualizar dados

### Persistência
- Auto-save em formulários longos
- Recuperação de sessão
- Preferências do usuário
- Cache offline básico
