
@echo off
chcp 65001 >nul
title Sistema AIH - Servidor Local

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    SISTEMA DE CONTROLE DE AIH               ║
echo ║                        Servidor Local                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verificar se o Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado!
    echo ℹ️  Instale o Node.js em: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas
    echo.
)

:: Verificar se a pasta db existe
if not exist "db" (
    echo 📁 Criando pasta do banco de dados...
    mkdir db
)

:: Verificar se a pasta logs existe
if not exist "logs" (
    echo 📁 Criando pasta de logs...
    mkdir logs
)

:: Verificar se a pasta backups existe
if not exist "backups" (
    echo 📁 Criando pasta de backups...
    mkdir backups
)

echo ℹ️  Pressione Ctrl+C para encerrar o servidor de forma segura
echo ℹ️  O sistema executará backup automático e limpeza ao encerrar
echo.
echo 🚀 Iniciando servidor...
echo ═══════════════════════════════════════════════════════════════
echo.

:: Iniciar o servidor
node server.js

:: Se chegou aqui, o servidor foi encerrado
echo.
echo ═══════════════════════════════════════════════════════════════
echo 👋 Servidor encerrado
echo.

:: Verificar se foi encerramento normal ou erro
if errorlevel 1 (
    echo ❌ Servidor encerrado com erro (Código: %errorlevel%)
    echo 🔧 Verifique os logs para mais detalhes
) else (
    echo ✅ Servidor encerrado normalmente
)

echo.
echo 📊 Para verificar o status do banco de dados, execute:
echo    sqlite3 db/aih.db ".tables"
echo.
echo 💾 Backups automáticos estão em: backups/
echo 📝 Logs do sistema estão em: logs/
echo.
pause
