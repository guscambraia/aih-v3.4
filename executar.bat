
@echo off
chcp 65001 >nul
title Sistema AIH - Servidor Local

echo.
echo ===============================================================
echo                    SISTEMA DE CONTROLE DE AIH               
echo                        Servidor Local                       
echo ===============================================================
echo.

:: Verificar se o Node.js esta instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo [INFO] Instale o Node.js em: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Matar processos existentes na porta 5000
echo [INFO] Verificando processos na porta 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    echo [INFO] Finalizando processo %%a na porta 5000
    taskkill /f /pid %%a >nul 2>&1
)

:: Verificar se as dependencias estao instaladas
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo [ERRO] Erro ao instalar dependencias!
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas
    echo.
)

:: Verificar se a pasta db existe
if not exist "db" (
    echo [INFO] Criando pasta do banco de dados...
    mkdir db
)

:: Verificar se a pasta logs existe
if not exist "logs" (
    echo [INFO] Criando pasta de logs...
    mkdir logs
)

:: Verificar se a pasta backups existe
if not exist "backups" (
    echo [INFO] Criando pasta de backups...
    mkdir backups
)

echo [INFO] Pressione Ctrl+C para encerrar o servidor de forma segura
echo [INFO] O sistema executara backup automatico e limpeza ao encerrar
echo.
echo [INICIO] Iniciando servidor...
echo ===============================================================
echo.

:: Iniciar o servidor
node server.js

:: Se chegou aqui, o servidor foi encerrado
echo.
echo ===============================================================
echo [FIM] Servidor encerrado
echo.

:: Verificar se foi encerramento normal ou erro
if errorlevel 1 (
    echo [ERRO] Servidor encerrado com erro (Codigo: %errorlevel%)
    echo [INFO] Verifique os logs para mais detalhes
) else (
    echo [OK] Servidor encerrado normalmente
)

echo.
echo [INFO] Para verificar o status do banco de dados, execute:
echo        sqlite3 db/aih.db ".tables"
echo.
echo [INFO] Backups automaticos estao em: backups/
echo [INFO] Logs do sistema estao em: logs/
echo.
echo [INFO] Sistema disponivel em: http://localhost:5000
echo [INFO] Login padrao: admin / admin123
echo.
pause
