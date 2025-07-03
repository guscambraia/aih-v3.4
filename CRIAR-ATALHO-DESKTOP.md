
# 🖥️ Como Criar Atalho na Área de Trabalho

## 📋 Instruções Rápidas

### 1. Criar o Atalho
1. **Clique com botão direito** na área de trabalho
2. Selecione **"Novo" > "Atalho"**
3. **Cole o caminho completo** do arquivo `iniciar-sistema-aih.bat`:
   ```
   C:\Projeto\aih-v3.4-master\iniciar-sistema-aih.bat
   ```
   *(Ajuste o caminho conforme sua instalação)*

4. Clique em **"Avançar"**
5. Nome do atalho: **"Sistema AIH"**
6. Clique em **"Concluir"**

### 2. Personalizar o Atalho (Opcional)
1. **Clique com botão direito** no atalho criado
2. Selecione **"Propriedades"**
3. **Configurações recomendadas:**
   - **Destino:** `C:\Projeto\aih-v3.4-master\iniciar-sistema-aih.bat`
   - **Iniciar em:** `C:\Projeto\aih-v3.4-master`
   - **Executar:** `Janela normal`
   - **Tecla de atalho:** (deixe vazio ou configure como preferir)

4. Para mudar o ícone:
   - Clique em **"Alterar Ícone..."**
   - Escolha um ícone do sistema ou procure um ícone personalizado

## ✨ Como Usar

### Execução Simples
- **Duplo clique** no atalho da área de trabalho
- O sistema irá:
  1. ✅ Verificar pré-requisitos automaticamente
  2. 📦 Instalar dependências (se necessário)
  3. 🗄️ Inicializar banco de dados (se necessário)
  4. 🚀 Iniciar o servidor
  5. 🌐 Abrir o navegador automaticamente
  6. 🎯 Ir direto para http://localhost:5000

### Login Padrão
- **Usuário:** admin
- **Senha:** admin

## 🔧 Solução de Problemas

### ❌ "Não foi possível encontrar os arquivos"
**Solução:** Verifique se o caminho no atalho está correto
1. Clique direito no atalho > Propriedades
2. Confirme se o "Destino" aponta para o arquivo correto
3. Confirme se "Iniciar em" aponta para a pasta do projeto

### ❌ "Node.js não encontrado"
**Solução:**
1. Instale Node.js: https://nodejs.org/
2. Reinicie o computador
3. Teste novamente

### ❌ "Erro na instalação de dependências"
**Solução:**
1. Abra Prompt de Comando como administrador
2. Navegue até a pasta: `cd C:\Projeto\aih-v3.4-master`
3. Execute: `npm install`
4. Teste o atalho novamente

### ❌ "Porta 5000 ocupada"
**Solução:** O script resolve automaticamente, mas se persistir:
1. Feche outros programas que possam usar a porta 5000
2. Reinicie o computador
3. Teste novamente

## 🎯 Dicas Avançadas

### Executar como Administrador (se necessário)
1. Clique direito no atalho
2. Selecione "Propriedades"
3. Aba "Atalho" > "Avançado..."
4. Marque "Executar como administrador"
5. OK > OK

### Criar Atalho no Menu Iniciar
1. Copie o atalho da área de trabalho
2. Cole em: `C:\ProgramData\Microsoft\Windows\Start Menu\Programs`
3. Aparecerá no menu Iniciar como "Sistema AIH"

### Adicionar à Barra de Tarefas
1. Clique direito no atalho
2. Selecione "Fixar na barra de tarefas"

## 📍 Localização dos Arquivos

```
C:\Projeto\aih-v3.4-master\
├── iniciar-sistema-aih.bat    # ← Arquivo principal do atalho
├── server.js                  # Servidor da aplicação
├── package.json              # Dependências
└── db\                       # Banco de dados
    └── aih.db
```

## 🚀 Resultado Final

Após criar o atalho, você terá:
- ✅ **Ícone na área de trabalho** para acesso rápido
- ✅ **Execução com duplo clique** - sem comandos manuais
- ✅ **Verificação automática** de pré-requisitos
- ✅ **Abertura automática** do navegador
- ✅ **Interface limpa** durante a inicialização
- ✅ **Opção de reinicialização** quando encerrar

---

**💡 Lembre-se:** Sempre mantenha o arquivo `iniciar-sistema-aih.bat` na mesma pasta do projeto!
