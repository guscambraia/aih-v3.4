
# Script PowerShell para executar o Sistema AIH
# Uso: .\executar.ps1

param(
    [switch]$Debug,
    [switch]$Force,
    [string]$Port = "5000"
)

# Configurar codificação para UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Definir cores para output
$SuccessColor = "Green"
$ErrorColor = "Red"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    
    $color = switch ($Type) {
        "Success" { $SuccessColor }
        "Error" { $ErrorColor }
        "Warning" { $WarningColor }
        default { $InfoColor }
    }
    
    Write-Host $Message -ForegroundColor $color
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Stop-ProcessOnPort {
    param([int]$PortNumber)
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $PortNumber -State Listen -ErrorAction SilentlyContinue
        foreach ($proc in $processes) {
            $process = Get-Process -Id $proc.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Status "🔄 Encerrando processo $($process.Name) (PID: $($process.Id))..." "Warning"
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
        }
        Start-Sleep -Seconds 2
    }
    catch {
        Write-Status "⚠️  Erro ao verificar processos na porta $PortNumber" "Warning"
    }
}

# Cabeçalho
Clear-Host
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    SISTEMA AIH - AUDITORIA                     ║" -ForegroundColor Cyan
Write-Host "║                  Sistema de Controle de AIH                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar permissões de administrador
if (-not (Test-Administrator)) {
    Write-Status "⚠️  ATENÇÃO: Não está executando como administrador" "Warning"
    Write-Status "   Algumas operações podem falhar" "Warning"
    Write-Status "   Para melhor funcionamento, execute como administrador" "Warning"
    Write-Host ""
} else {
    Write-Status "✅ Executando como administrador" "Success"
}

# Definir diretório do projeto
$ProjectDir = Get-Location
Write-Status "📁 Diretório do projeto: $ProjectDir" "Info"

# Verificar arquivos essenciais
$essentialFiles = @("server.js", "package.json")
foreach ($file in $essentialFiles) {
    if (-not (Test-Path $file)) {
        Write-Status "❌ ERRO: Arquivo $file não encontrado!" "Error"
        Write-Status "   Certifique-se de estar executando o script na pasta correta" "Error"
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}
Write-Status "✅ Arquivos essenciais encontrados" "Success"

# Verificar Node.js
Write-Host ""
Write-Status "🔍 Verificando pré-requisitos..." "Info"

try {
    $nodeVersion = node --version 2>$null
    $npmVersion = npm --version 2>$null
    
    if (-not $nodeVersion) {
        throw "Node.js não encontrado"
    }
    
    Write-Status "✅ Node.js encontrado: $nodeVersion" "Success"
    Write-Status "✅ NPM versão: $npmVersion" "Success"
}
catch {
    Write-Status "❌ ERRO: Node.js não foi encontrado no sistema!" "Error"
    Write-Host ""
    Write-Status "📌 SOLUÇÕES:" "Info"
    Write-Status "   1. Baixe o Node.js em: https://nodejs.org/" "Info"
    Write-Status "   2. Instale a versão LTS recomendada (v18 ou superior)" "Info"
    Write-Status "   3. Reinicie o PowerShell após a instalação" "Info"
    Write-Status "   4. Verifique se Node.js foi adicionado ao PATH" "Info"
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar política de execução
$executionPolicy = Get-ExecutionPolicy
if ($executionPolicy -eq "Restricted") {
    Write-Status "🔒 ATENÇÃO: Política de execução está restritiva" "Warning"
    Write-Status "   Para permitir scripts: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" "Info"
}

# Verificar e instalar dependências
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Status "📦 Primeira execução detectada!" "Info"
    Write-Status "📦 Instalando dependências do sistema..." "Info"
    Write-Host ""
    Write-Status "🔄 Executando: npm install" "Info"
    
    try {
        & npm install --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) {
            throw "Erro na instalação"
        }
        Write-Status "✅ Dependências instaladas com sucesso!" "Success"
    }
    catch {
        Write-Status "❌ ERRO: Falha na instalação das dependências!" "Error"
        Write-Host ""
        Write-Status "💡 POSSÍVEIS SOLUÇÕES:" "Info"
        Write-Status "   1. Verifique sua conexão com a internet" "Info"
        Write-Status "   2. Execute como administrador" "Info"
        Write-Status "   3. Limpe o cache: npm cache clean --force" "Info"
        Write-Status "   4. Tente: npm install --legacy-peer-deps" "Info"
        Write-Host ""
        Read-Host "Pressione Enter para sair"
        exit 1
    }
} else {
    Write-Status "✅ Dependências já instaladas" "Success"
}

# Verificar e liberar porta
Write-Host ""
Write-Status "🔍 Verificando porta $Port..." "Info"

try {
    $PortInUse = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($PortInUse) {
        Write-Status "⚠️  Porta $Port em uso! Tentando liberar..." "Warning"
        Stop-ProcessOnPort $Port
        
        # Verificar novamente
        $PortInUse = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($PortInUse) {
            Write-Status "⚠️  Alguns processos ainda estão usando a porta $Port" "Warning"
            Write-Status "   O sistema tentará usar outra porta automaticamente" "Info"
        } else {
            Write-Status "✅ Porta $Port liberada com sucesso" "Success"
        }
    } else {
        Write-Status "✅ Porta $Port disponível" "Success"
    }
}
catch {
    Write-Status "⚠️  Erro ao verificar porta $Port" "Warning"
}

# Verificar/criar diretório de banco de dados
if (-not (Test-Path "db")) {
    Write-Status "🗄️ Criando diretório do banco de dados..." "Info"
    New-Item -ItemType Directory -Name "db" | Out-Null
}

# Verificar se o banco de dados existe
if (-not (Test-Path "db\aih.db")) {
    Write-Host ""
    Write-Status "🗄️ Primeira execução - Inicializando banco de dados..." "Info"
    
    try {
        & node database.js
        if ($LASTEXITCODE -ne 0) {
            throw "Erro na inicialização"
        }
        Write-Status "✅ Banco de dados inicializado!" "Success"
    }
    catch {
        Write-Status "❌ Erro ao inicializar banco de dados!" "Error"
        Write-Status "   Verifique se o arquivo database.js existe e está correto" "Error"
        Read-Host "Pressione Enter para sair"
        exit 1
    }
} else {
    Write-Status "✅ Banco de dados encontrado" "Success"
}

# Verificar arquivos de configuração
if (-not (Test-Path "config.js")) {
    Write-Status "⚠️  Arquivo config.js não encontrado, usando configurações padrão" "Warning"
}

# Configurar variáveis de ambiente
$env:NODE_ENV = if ($Debug) { "development" } else { "production" }
$env:PORT = $Port

# Iniciar o servidor
Write-Host ""
Write-Status "🚀 INICIANDO SISTEMA AIH..." "Info"
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Status "📍 Servidor será iniciado em: http://localhost:$Port" "Info"
Write-Status "🔐 Login padrão: admin / admin" "Info"
Write-Status "📋 Para parar o servidor: Ctrl + C" "Info"
Write-Status "💻 Diretório de trabalho: $ProjectDir" "Info"
Write-Status "🌐 Ambiente: $($env:NODE_ENV)" "Info"
Write-Host ""
Write-Status "⏳ Aguarde alguns segundos para o sistema inicializar..." "Info"
Write-Host ""

# Aguardar e abrir navegador
Start-Sleep -Seconds 3

try {
    Start-Process "http://localhost:$Port" -ErrorAction SilentlyContinue
}
catch {
    Write-Status "⚠️  Não foi possível abrir o navegador automaticamente" "Warning"
}

# Timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Status "[$timestamp] Iniciando servidor Node.js..." "Info"

# Iniciar o servidor
Write-Status "🔥 Executando: node server.js" "Info"
Write-Host ""

try {
    & node server.js
    $exitCode = $LASTEXITCODE
}
catch {
    $exitCode = 1
    Write-Status "❌ Erro ao executar o servidor: $($_.Exception.Message)" "Error"
}

# Servidor encerrado
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "                    SERVIDOR ENCERRADO" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Status "Código de saída: $exitCode" "Info"
Write-Status "Hora: $(Get-Date)" "Info"
Write-Host ""

if ($exitCode -ne 0) {
    Write-Status "❌ O servidor encerrou com erro (código $exitCode)" "Error"
} else {
    Write-Status "✅ O servidor foi encerrado normalmente" "Success"
}

Write-Host ""
Write-Status "🔧 OPÇÕES DISPONÍVEIS:" "Info"
Write-Host ""
Write-Host "1. Reiniciar o servidor automaticamente"
Write-Host "2. Executar em modo debug (logs detalhados)"
Write-Host "3. Executar testes do sistema"
Write-Host "4. Verificar logs de erro"
Write-Host "5. Reinstalar dependências"
Write-Host "6. Limpar cache e reiniciar"
Write-Host "7. Verificar status do sistema"
Write-Host "8. Sair"
Write-Host ""

do {
    $opcao = Read-Host "Digite sua escolha (1-8)"
    
    switch ($opcao) {
        "1" {
            Write-Status "🔄 Reiniciando servidor..." "Info"
            Stop-ProcessOnPort $Port
            Start-Sleep -Seconds 2
            & $PSCommandPath @PSBoundParameters
            exit
        }
        "2" {
            Write-Status "🐛 Iniciando em modo debug..." "Info"
            if (Test-Path "debug-start.bat") {
                & cmd /c "debug-start.bat"
            } else {
                $env:DEBUG = "*"
                $env:NODE_ENV = "development"
                & node server.js
            }
            break
        }
        "3" {
            Write-Status "🧪 Executando testes..." "Info"
            if (Test-Path "executar-testes.bat") {
                & cmd /c "executar-testes.bat"
            } else {
                & npm test
            }
            break
        }
        "4" {
            Write-Status "📋 Verificando logs..." "Info"
            if (Test-Path "logs") {
                $logFiles = Get-ChildItem "logs\*.log" -ErrorAction SilentlyContinue
                if ($logFiles) {
                    Write-Status "Arquivos de log encontrados:" "Info"
                    $logFiles | ForEach-Object { Write-Host "  $($_.Name)" }
                    
                    $newestLog = $logFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                    if ($newestLog) {
                        Write-Host ""
                        Write-Status "=== Últimas 20 linhas do log mais recente: $($newestLog.Name) ===" "Info"
                        Get-Content $newestLog.FullName -Tail 20
                    }
                } else {
                    Write-Status "Nenhum arquivo de log encontrado" "Warning"
                }
            } else {
                Write-Status "ℹ️ Nenhum diretório de logs encontrado." "Info"
            }
            Read-Host "Pressione Enter para continuar"
            break
        }
        "5" {
            Write-Status "📦 Reinstalando dependências..." "Info"
            if (Test-Path "node_modules") {
                Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
            }
            if (Test-Path "package-lock.json") {
                Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
            }
            & npm install --no-audit --no-fund
            if ($LASTEXITCODE -eq 0) {
                Write-Status "✅ Dependências reinstaladas com sucesso" "Success"
                $continuar = Read-Host "Deseja reiniciar o servidor agora? (s/n)"
                if ($continuar -eq "s" -or $continuar -eq "S") {
                    & $PSCommandPath @PSBoundParameters
                    exit
                }
            } else {
                Write-Status "❌ Erro na reinstalação" "Error"
            }
            break
        }
        "6" {
            Write-Status "🧹 Limpando cache e reiniciando..." "Info"
            & npm cache clean --force
            Stop-ProcessOnPort $Port
            Start-Sleep -Seconds 3
            & $PSCommandPath @PSBoundParameters
            exit
        }
        "7" {
            Write-Host ""
            Write-Status "📊 VERIFICANDO STATUS DO SISTEMA..." "Info"
            Write-Host ""
            Write-Status "=== INFORMAÇÕES DO SISTEMA ===" "Info"
            try {
                $nodeVer = & node --version 2>$null
                Write-Status "Node.js: $nodeVer" "Success"
            } catch {
                Write-Status "❌ Node.js não encontrado" "Error"
            }
            
            try {
                $npmVer = & npm --version 2>$null
                Write-Status "NPM: $npmVer" "Success"
            } catch {
                Write-Status "❌ NPM não encontrado" "Error"
            }
            
            Write-Host ""
            Write-Status "=== ARQUIVOS ESSENCIAIS ===" "Info"
            @("server.js", "package.json", "database.js", "node_modules", "db\aih.db") | ForEach-Object {
                if (Test-Path $_) {
                    Write-Status "✅ $_" "Success"
                } else {
                    Write-Status "❌ $_" "Error"
                }
            }
            
            Write-Host ""
            Write-Status "=== PROCESSOS ATIVOS NA PORTA $Port ===" "Info"
            try {
                $portProcesses = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
                if ($portProcesses) {
                    $portProcesses | ForEach-Object {
                        $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
                        if ($proc) {
                            Write-Status "🔄 $($proc.Name) (PID: $($proc.Id))" "Warning"
                        }
                    }
                } else {
                    Write-Status "ℹ️ Nenhum processo na porta $Port" "Info"
                }
            } catch {
                Write-Status "Erro ao verificar processos" "Warning"
            }
            
            Write-Host ""
            Write-Status "=== ESPAÇO EM DISCO ===" "Info"
            $drive = Get-PSDrive -Name $PWD.Drive.Name
            $freeGB = [math]::Round($drive.Free / 1GB, 2)
            $usedGB = [math]::Round($drive.Used / 1GB, 2)
            Write-Status "Livre: ${freeGB}GB | Usado: ${usedGB}GB" "Info"
            
            Read-Host "Pressione Enter para continuar"
            break
        }
        "8" {
            break
        }
        default {
            Write-Status "Opção inválida, tente novamente" "Warning"
        }
    }
} while ($opcao -ne "8")

Write-Host ""
Write-Status "👋 Obrigado por usar o Sistema AIH!" "Success"
Write-Host ""
Write-Status "💡 DICAS ÚTEIS:" "Info"
Write-Status "   • Para executar: .\executar.ps1" "Info"
Write-Status "   • Para debug: .\executar.ps1 -Debug" "Info"
Write-Status "   • Para porta específica: .\executar.ps1 -Port 3000" "Info"
Write-Status "   • Para backups: Acesse Admin > Backup no sistema" "Info"
Write-Status "   • Para relatórios: Use a seção Relatórios" "Info"
Write-Status "   • Diretório do projeto: $ProjectDir" "Info"
Write-Host ""
Write-Status "📧 SOLUÇÃO DE PROBLEMAS:" "Info"
Write-Status "   • Execute sempre: .\executar.ps1 (com .\)" "Info"
Write-Status "   • Se política restritiva: Set-ExecutionPolicy RemoteSigned -Scope CurrentUser" "Info"
Write-Status "   • Execute como administrador quando possível" "Info"
Write-Status "   • Verifique antivírus que podem bloquear scripts" "Info"
Write-Host ""
Read-Host "Pressione Enter para sair"
