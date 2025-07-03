
@echo off
title Sistema AIH - Modo Debug
color 0A

echo.
echo ================================
echo   SISTEMA AIH - MODO DEBUG
echo ================================
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

REM Definir variáveis de ambiente para debug
set NODE_ENV=development
set DEBUG=true

echo.
echo 🐛 Iniciando servidor em modo DEBUG...
echo 📍 Servidor disponível em: http://localhost:5000
echo 📋 Logs detalhados serão exibidos
echo 📊 Debug SQL, requests e performance ativados
echo.
echo Para parar o servidor: Ctrl + C
echo.

REM Iniciar o servidor em modo debug
node --inspect server.js

echo.
echo 🔄 Servidor encerrado.
pause
