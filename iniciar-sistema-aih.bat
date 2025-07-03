
@echo off
title Sistema AIH - Inicializando...

REM Script otimizado para atalho da área de trabalho
REM Navega automaticamente para o diretório correto e inicia o sistema

REM Detectar o diretório onde o script está localizado
cd /d "%~dp0"

REM Verificar se estamos no diretório correto
if not exist "server.js" (
    echo.
    echo ❌ ERRO: Não foi possível encontrar os arquivos do sistema AIH
    echo    Certifique-se de que o atalho está apontando para a pasta correta
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

REM Instalar dependências se necessário (silencioso)
if not exist "node_modules" (
    echo 📦 Instalando dependências... Aguarde...
    npm install --silent --no-progress >nul 2>&1
    if errorlevel 1 (
        echo ❌ Erro na instalação. Execute: npm install
        pause
        exit /b 1
    )
)

REM Liberar porta 5000 se ocupada (silencioso)
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

REM Aguardar 3 segundos e abrir navegador
timeout /t 3 >nul
start "" "http://localhost:5000" >nul 2>&1

REM Iniciar servidor (sem logs no console para deixar limpo)
node server.js

REM Se o servidor parar, perguntar se quer reiniciar
if errorlevel 1 (
    echo.
    echo ⚠️  O sistema foi encerrado.
) else (
    echo.
    echo ✅ Sistema encerrado normalmente.
)

echo.
set /p restart="Deseja reiniciar o sistema? (s/n): "
if /i "%restart%"=="s" (
    echo.
    echo 🔄 Reiniciando...
    goto :eof
    "%~f0"
)

echo.
echo 👋 Até logo!
timeout /t 3 >nul
