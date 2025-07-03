@echo off
chcp 65001 >nul 2>&1
title Sistema AIH - Inicializando...

REM Detectar o diretório onde o script está localizado
cd /d "%~dp0"

REM Verificar se estamos no diretório correto
if not exist "server.js" (
    echo.
    echo ❌ ERRO: Não foi possível encontrar os arquivos do sistema AIH
    echo    Certifique-se de que o script está na pasta correta
    echo.
    echo 📁 Diretório atual: %cd%
    echo.
    pause
    exit /b 1
)

REM Verificar Node.js rapidamente
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ Node.js não encontrado! 
    echo    Instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Limpar console e mostrar cabeçalho
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    🚀 SISTEMA AIH - INICIANDO                  ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo 📦 Instalando dependências... Aguarde...
    npm install --silent --no-progress >nul 2>&1
    if errorlevel 1 (
        echo ❌ Erro na instalação. Execute: npm install
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas!
)

REM Liberar porta 5000 se ocupada
netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo 🔄 Liberando porta 5000...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING 2^>nul') do (
        taskkill /pid %%i /f >nul 2>&1
    )
    timeout /t 2 >nul
)

REM Verificar/criar banco de dados
if not exist "db" mkdir db >nul 2>&1
if not exist "db\aih.db" (
    echo 🗄️ Inicializando banco de dados...
    node database.js >nul 2>&1
)

REM Iniciar sistema
echo ✅ Iniciando Sistema AIH...
echo.
echo 🌐 URL: http://localhost:5000
echo 🔐 Login: admin / admin
echo.
echo ⏳ Aguarde... O navegador abrirá automaticamente!
echo.

REM Aguardar 3 segundos e abrir navegador
timeout /t 3 >nul
start "" "http://localhost:5000" >nul 2>&1

REM Iniciar servidor
echo 🚀 Servidor iniciando...
node server.js

REM Se o servidor parar
echo.
echo ═══════════════════════════════════════════════════════════════
echo                    SERVIDOR ENCERRADO
echo ═══════════════════════════════════════════════════════════════
echo.

:menu
echo 🔧 OPÇÕES DISPONÍVEIS:
echo.
echo 1. Reiniciar o servidor
echo 2. Verificar logs
echo 3. Reinstalar dependências
echo 4. Limpar cache
echo 5. Verificar status
echo 6. Sair
echo.

set /p "opcao=Digite sua escolha (1-6): "

if "%opcao%"=="1" (
    echo.
    echo 🔄 Reiniciando servidor...
    goto inicio
)

if "%opcao%"=="2" (
    echo.
    echo 📋 Verificando logs...
    if exist "logs" (
        dir logs\*.log 2>nul && (
            echo Arquivos de log encontrados:
            dir logs\*.log /b
        ) || (
            echo Nenhum arquivo de log encontrado
        )
    ) else (
        echo ℹ️ Nenhum diretório de logs encontrado
    )
    echo.
    pause
    goto menu
)

if "%opcao%"=="3" (
    echo.
    echo 📦 Reinstalando dependências...
    if exist "node_modules" rmdir /s /q "node_modules" >nul 2>&1
    if exist "package-lock.json" del "package-lock.json" >nul 2>&1
    npm install
    if errorlevel 0 (
        echo ✅ Dependências reinstaladas com sucesso
        set /p "continuar=Deseja reiniciar o servidor agora? (s/n): "
        if /i "%continuar%"=="s" goto inicio
    ) else (
        echo ❌ Erro na reinstalação
    )
    goto menu
)

if "%opcao%"=="4" (
    echo.
    echo 🧹 Limpando cache...
    npm cache clean --force
    echo ✅ Cache limpo
    pause
    goto menu
)

if "%opcao%"=="5" (
    echo.
    echo 📊 VERIFICANDO STATUS DO SISTEMA...
    echo.
    echo === INFORMAÇÕES DO SISTEMA ===
    node --version 2>nul && echo ✅ Node.js: || echo ❌ Node.js não encontrado
    npm --version 2>nul && echo ✅ NPM: || echo ❌ NPM não encontrado
    echo.
    echo === ARQUIVOS ESSENCIAIS ===
    if exist "server.js" (echo ✅ server.js) else (echo ❌ server.js)
    if exist "package.json" (echo ✅ package.json) else (echo ❌ package.json)
    if exist "database.js" (echo ✅ database.js) else (echo ❌ database.js)
    if exist "node_modules" (echo ✅ node_modules) else (echo ❌ node_modules)
    if exist "db\aih.db" (echo ✅ db\aih.db) else (echo ❌ db\aih.db)
    echo.
    echo === PROCESSOS NA PORTA 5000 ===
    netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1 && (
        echo ⚠️ Processos encontrados na porta 5000
        netstat -ano | findstr :5000
    ) || (
        echo ℹ️ Nenhum processo na porta 5000
    )
    echo.
    pause
    goto menu
)

if "%opcao%"=="6" (
    goto sair
)

echo Opção inválida, tente novamente
goto menu

:inicio
cls
goto start

:start
REM Voltar ao início do script
goto begin

:begin
REM Detectar o diretório onde o script está localizado
cd /d "%~dp0"
goto main

:main
REM Verificar se estamos no diretório correto
if not exist "server.js" (
    echo.
    echo ❌ ERRO: Não foi possível encontrar os arquivos do sistema AIH
    echo    Certifique-se de que o script está na pasta correta
    echo.
    echo 📁 Diretório atual: %cd%
    echo.
    pause
    exit /b 1
)

REM Liberar porta 5000 se ocupada
netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo 🔄 Liberando porta 5000...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING 2^>nul') do (
        taskkill /pid %%i /f >nul 2>&1
    )
    timeout /t 2 >nul
)

echo 🚀 Executando: node server.js
node server.js
goto menu

:sair
echo.
echo 👋 Obrigado por usar o Sistema AIH!
echo.
echo 💡 DICAS ÚTEIS:
echo    • Para executar: executar.bat
echo    • Para PowerShell: .\executar.bat
echo    • Execute sempre da pasta do projeto
echo    • URL do sistema: http://localhost:5000
echo.
echo 📧 SOLUÇÃO DE PROBLEMAS:
echo    • Verifique se Node.js está instalado
echo    • Execute como administrador quando necessário
echo    • Certifique-se de estar na pasta correta
echo.
pause