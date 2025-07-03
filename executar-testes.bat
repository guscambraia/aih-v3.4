
@echo off
title Sistema AIH - Executar Testes
color 0B

echo.
echo ====================================
echo   SISTEMA AIH - SUITE DE TESTES
echo ====================================
echo.

REM Verificar se Node.js está instalado
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado: 
node -v

REM Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo.
    echo 📦 Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependencias!
        pause
        exit /b 1
    )
)

REM Verificar se node-fetch está instalado
echo.
echo 📦 Verificando dependencias de teste...
npm list node-fetch >nul 2>&1
if errorlevel 1 (
    echo 📦 Instalando node-fetch para testes...
    npm install node-fetch@2.7.0
)

echo.
echo 🚀 Iniciando servidor em background para testes...

REM Matar processos existentes na porta 5000
netstat -ano | findstr :5000 | findstr LISTENING >nul
if not errorlevel 1 (
    echo 🔄 Encerrando servidor existente na porta 5000...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do taskkill /pid %%i /f >nul 2>&1
    timeout /t 2 >nul
)

REM Iniciar servidor para testes
set NODE_ENV=test
start /b node server.js

REM Aguardar servidor inicializar
echo 🔄 Aguardando servidor inicializar...
timeout /t 5 >nul

REM Verificar se servidor está rodando
netstat -ano | findstr :5000 | findstr LISTENING >nul
if errorlevel 1 (
    echo ❌ ERRO: Servidor não conseguiu inicializar na porta 5000!
    echo.
    echo Verifique se a porta está livre e tente novamente.
    pause
    exit /b 1
)

echo ✅ Servidor iniciado com sucesso!
echo.

echo 🧪 EXECUTANDO TESTES...
echo ========================

REM Menu de opções de teste
echo.
echo Escolha o tipo de teste:
echo.
echo 1. Todos os testes (Suite completa)
echo 2. Testes unitarios apenas
echo 3. Testes de integracao apenas
echo 4. Testes de performance apenas
echo 5. Testes de carga apenas
echo 6. Testes de estresse apenas
echo 7. Analise de logs de debug
echo.
set /p choice="Digite sua escolha (1-7): "

if "%choice%"=="1" (
    echo.
    echo 🔄 Executando TODOS os testes...
    node tests/test-runner.js
) else if "%choice%"=="2" (
    echo.
    echo 🔬 Executando testes UNITÁRIOS...
    node tests/unit-tests.js
) else if "%choice%"=="3" (
    echo.
    echo 🔗 Executando testes de INTEGRAÇÃO...
    node tests/integration-tests.js
) else if "%choice%"=="4" (
    echo.
    echo ⚡ Executando testes de PERFORMANCE...
    node tests/performance-tests.js
) else if "%choice%"=="5" (
    echo.
    echo 📈 Executando testes de CARGA...
    node tests/load-tests.js
) else if "%choice%"=="6" (
    echo.
    echo 🔥 Executando testes de ESTRESSE...
    node tests/stress-tests.js
) else if "%choice%"=="7" (
    echo.
    echo 📊 Analisando logs de debug...
    node -e "const debug = require('./tests/debug-helper.js'); debug.analyzeLogs();"
) else (
    echo.
    echo ❌ Opção inválida! Executando todos os testes...
    node tests/test-runner.js
)

echo.
echo ========================
echo 🏁 TESTES CONCLUÍDOS!
echo ========================

REM Parar servidor de teste
echo.
echo 🔄 Encerrando servidor de teste...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do taskkill /pid %%i /f >nul 2>&1

echo.
echo 📋 Resumo:
echo - Relatórios de teste salvos em tests/reports/
echo - Logs de debug disponíveis em tests/debug.log
echo - Para mais detalhes, execute testes individuais
echo.

pause
