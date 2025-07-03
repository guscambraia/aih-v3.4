
# 🖥️ Guia de Execução - Sistema AIH no Windows

Este guia ensina como executar o Sistema de Controle de Auditoria de AIH no Windows usando scripts .bat.

## 📋 Pré-requisitos

### 1. Node.js
- Baixe e instale o Node.js em: https://nodejs.org/
- Versão recomendada: 18.x ou superior
- Verifique a instalação: `node -v` e `npm -v`

### 2. Git (opcional)
- Para clonar o repositório: https://git-scm.com/

## 🚀 Configuração Inicial

### 1. Download do Sistema
```bash
# Opção 1: Clone do repositório
git clone <URL_DO_REPOSITORIO>
cd sistema-aih

# Opção 2: Download e extração do ZIP
# Baixe o arquivo ZIP e extraia em uma pasta
```

### 2. Instalação de Dependências
Execute o script de instalação:
```batch
# Execute uma única vez
npm install
```

## 📝 Scripts Disponíveis

O sistema inclui vários scripts .bat para facilitar o uso:

### 1. `executar.bat` - Execução Normal
```batch
# Executa a aplicação em modo normal
executar.bat
```

**Funcionalidades:**
- ✅ Verifica instalação do Node.js
- 📦 Instala dependências automaticamente (se necessário)
- 🚀 Inicia o servidor na porta 5000
- 🌐 Abre automaticamente no navegador
- 🔄 Reinicia automaticamente em caso de erro

### 2. `debug-start.bat` - Modo Debug
```batch
# Executa em modo de desenvolvimento com debug
debug-start.bat
```

**Funcionalidades:**
- 🐛 Logs detalhados de SQL e requests
- 📊 Monitoramento de performance
- 🔧 Inspector do Node.js ativado
- 📋 Variáveis de ambiente de desenvolvimento
- ⚡ Hot reload para desenvolvimento

### 3. `executar-testes.bat` - Suite de Testes
```batch
# Executa todos os testes da aplicação
executar-testes.bat
```

**Opções de teste disponíveis:**
1. **Todos os testes** - Suite completa
2. **Testes unitários** - Validação de funções individuais
3. **Testes de integração** - Fluxos completos da aplicação
4. **Testes de performance** - Velocidade e otimização
5. **Testes de carga** - Múltiplos usuários simultâneos
6. **Testes de estresse** - Limites do sistema
7. **Análise de logs** - Debug e monitoramento

## 🔧 Instruções de Uso Detalhadas

### Execução Normal da Aplicação

1. **Abra o Prompt de Comando como Administrador**
   - Pressione `Win + R`
   - Digite `cmd`
   - Pressione `Ctrl + Shift + Enter`

2. **Navegue até a pasta do sistema**
   ```cmd
   cd C:\caminho\para\sistema-aih
   ```

3. **Execute o script principal**
   ```cmd
   executar.bat
   ```

4. **Aguarde a inicialização**
   - O script verificará automaticamente os pré-requisitos
   - Instalará dependências se necessário
   - Iniciará o servidor
   - Abrirá o navegador automaticamente

5. **Acesse o sistema**
   - URL: http://localhost:5000
   - Login padrão: admin / admin123

### Execução em Modo Debug

1. **Para desenvolvimento e troubleshooting**
   ```cmd
   debug-start.bat
   ```

2. **Recursos disponíveis no modo debug:**
   - Logs SQL detalhados no console
   - Monitoramento de requests HTTP
   - Análise de performance de queries
   - Inspector do Node.js em http://localhost:9229
   - Variáveis de ambiente de desenvolvimento

### Execução da Suite de Testes

1. **Execute o script de testes**
   ```cmd
   executar-testes.bat
   ```

2. **Escolha o tipo de teste no menu:**
   ```
   Escolha o tipo de teste:
   
   1. Todos os testes (Suite completa)
   2. Testes unitários apenas
   3. Testes de integração apenas
   4. Testes de performance apenas
   5. Testes de carga apenas
   6. Testes de estresse apenas
   7. Análise de logs de debug
   
   Digite sua escolha (1-7):
   ```

3. **Interpretação dos resultados:**
   - ✅ Verde: Teste passou
   - ❌ Vermelho: Teste falhou
   - 📊 Relatórios salvos em `tests/reports/`
   - 📋 Logs detalhados em `tests/debug.log`

## 📊 Monitoramento e Logs

### Logs da Aplicação
- **Local:** Console do terminal
- **Tipos:** Info, Error, SQL queries, HTTP requests
- **Formato:** Timestamp + Tipo + Mensagem

### Logs de Teste
- **Relatórios:** `tests/reports/test-report-[timestamp].json`
- **Debug:** `tests/debug.log`
- **Performance:** Métricas de tempo e memória

### Monitoramento do Sistema
```cmd
# Verificar processos rodando na porta 5000
netstat -ano | findstr :5000

# Verificar uso de memória do Node.js
tasklist | findstr node
```

## 🔧 Solução de Problemas

### Erro: "Node.js não encontrado"
```cmd
# Verifique se Node.js está instalado
node -v
npm -v

# Se não estiver, baixe em: https://nodejs.org/
```

### Erro: "Porta 5000 em uso"
```cmd
# Encontre o processo usando a porta
netstat -ano | findstr :5000

# Mate o processo (substitua PID pelo número encontrado)
taskkill /pid [PID] /f

# Ou execute o script que faz isso automaticamente
executar.bat
```

### Erro: "Dependências não instaladas"
```cmd
# Limpe o cache do npm
npm cache clean --force

# Remova node_modules e reinstale
rmdir /s node_modules
npm install
```

### Erro: "Banco de dados corrompido"
```cmd
# Pare o servidor
Ctrl + C

# Execute limpeza do banco
node database.js

# Reinicie
executar.bat
```

### Erro: "Permissões insuficientes"
```cmd
# Execute como administrador
# Clique direito no Prompt de Comando
# Selecione "Executar como administrador"
```

## 📁 Estrutura de Arquivos

```
sistema-aih/
├── executar.bat              # Script principal de execução
├── debug-start.bat           # Script para modo debug
├── executar-testes.bat       # Script para testes
├── server.js                 # Servidor principal
├── database.js               # Configuração do banco
├── package.json              # Dependências do projeto
├── public/                   # Arquivos web (HTML, CSS, JS)
├── tests/                    # Suite de testes
├── db/                       # Banco de dados SQLite
└── docs/                     # Documentação
```

## 🎯 Comandos Úteis

### Execução Manual (sem scripts)
```cmd
# Instalar dependências
npm install

# Iniciar servidor normal
npm start

# Iniciar em modo desenvolvimento
npm run dev

# Executar testes específicos
npm test
npm run test:unit
npm run test:integration
npm run test:performance
```

### Backup e Manutenção
```cmd
# Backup do banco de dados
# Acesse: http://localhost:5000 > Admin > Backup

# Limpeza de logs antigos
# Acesse: http://localhost:5000 > Admin > Manutenção
```

## 🛡️ Segurança

### Configurações de Firewall
- Permita conexões na porta 5000 para localhost
- Não exponha a porta externamente em produção

### Credenciais Padrão
- **Admin:** admin / admin123
- **Primeiro acesso:** Altere a senha imediatamente
- **Usuários:** Cadastre através do painel admin

## 📞 Suporte

### Logs para Suporte
```cmd
# Colete estes logs em caso de problemas:
1. Output do console durante a execução
2. Arquivo tests/debug.log
3. Versão do Node.js: node -v
4. Sistema operacional: Windows 10/11
5. Relatório de erro específico
```

### Verificação do Sistema
```cmd
# Execute verificação completa
executar-testes.bat
# Escolha opção 1 (Todos os testes)
# Envie o relatório gerado em tests/reports/
```

## 🔄 Atualizações

### Atualizando o Sistema
```cmd
# 1. Pare o servidor (Ctrl + C)
# 2. Faça backup do banco de dados
# 3. Substitua os arquivos do sistema
# 4. Execute:
npm install
executar.bat
```

### Verificando Atualizações
```cmd
# Verificar versão atual
node -p "require('./package.json').version"

# Verificar dependências desatualizadas
npm outdated
```

---

**💡 Dica:** Sempre execute os scripts como administrador para evitar problemas de permissão.

**⚠️ Importante:** Mantenha backups regulares do banco de dados antes de atualizações ou modificações importantes.
