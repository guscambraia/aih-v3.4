
# 🚀 Como Executar o Sistema AIH no Windows

## ⚡ Execução Rápida

### No PowerShell (Recomendado)
```powershell
# Navegue até a pasta do projeto
cd C:\Projeto\aih-v3.4-master

# Execute o script (SEMPRE com .\ no início)
.\executar.ps1
```

### No Prompt de Comando (CMD)
```cmd
# Navegue até a pasta do projeto
cd C:\Projeto\aih-v3.4-master

# Execute o script
executar.bat
```

## 🔧 Problemas Comuns e Soluções

### ❌ Erro: "executar.bat não é reconhecido"
**Problema:** Você está no PowerShell e tentou executar sem `.\`

**Solução:**
```powershell
# ✅ CORRETO no PowerShell
.\executar.bat
# ou melhor ainda:
.\executar.ps1
```

### ❌ Erro: "não é possível carregar... política de execução"
**Problema:** PowerShell com política restritiva

**Solução:**
```powershell
# Execute como administrador e digite:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Depois execute normalmente:
.\executar.ps1
```

### ❌ Erro: "Node.js não encontrado"
**Solução:**
1. Baixe Node.js em: https://nodejs.org/
2. Instale a versão LTS (v18+)
3. Reinicie o computador
4. Tente novamente

### ❌ Erro: "Porta 5000 em uso"
**Solução:** O script resolve automaticamente, mas se persistir:
```powershell
# Encerrar processos manualmente
Get-Process node | Stop-Process -Force

# Ou usar netstat
netstat -ano | findstr :5000
# Anotar o PID e executar:
taskkill /pid [PID] /f
```

## 🎯 Qual Script Usar?

| Situação | Use | Comando |
|----------|-----|---------|
| PowerShell normal | `executar.ps1` | `.\executar.ps1` |
| PowerShell com debug | `executar.ps1` | `.\executar.ps1 -Debug` |
| CMD/Prompt | `executar.bat` | `executar.bat` |
| Primeira vez | Qualquer um | Instalará tudo automaticamente |

## ✅ Verificação Rápida

Antes de executar, verifique se você está na pasta correta:
```powershell
# Deve mostrar os arquivos do sistema
dir server.js, package.json, executar.bat

# Se não mostrar, navegue para a pasta correta:
cd C:\Projeto\aih-v3.4-master
```

## 🌐 Após Inicializar

1. **URL do sistema:** http://localhost:5000
2. **Login padrão:** admin / admin
3. **Para parar:** Pressione `Ctrl + C` no terminal

## 📞 Precisa de Ajuda?

1. Execute com debug: `.\executar.ps1 -Debug`
2. Verifique logs na opção 4 do menu
3. Execute testes na opção 3 do menu
4. Reinstale dependências na opção 5 do menu

---

**💡 Lembre-se:** No PowerShell, SEMPRE use `.\` antes do nome do arquivo!
