
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

:: Mostrar informações do Node.js
echo [DEBUG] Versao do Node.js:
node --version
echo [DEBUG] Versao do NPM:
npm --version
echo.

:: Verificar se o arquivo server.js existe
if not exist "server.js" (
    echo [ERRO] Arquivo server.js nao encontrado!
    echo [INFO] Verifique se voce esta na pasta correta do projeto
    echo.
    pause
    exit /b 1
)

:: Mostrar conteúdo da pasta atual para debug
echo [DEBUG] Arquivos na pasta atual:
dir /b *.js
echo.

:: Iniciar o servidor com logging melhorado
echo [DEBUG] Executando: node server.js
echo [DEBUG] Pasta atual: %CD%
echo.
node server.js

:: Capturar o código de saída
set EXIT_CODE=%errorlevel%

:: Se chegou aqui, o servidor foi encerrado
echo.
echo ===============================================================
echo [FIM] Servidor encerrado - Codigo de saida: %EXIT_CODE%
echo ===============================================================
echo.

:: Verificar se foi encerramento normal ou erro
if %EXIT_CODE% neq 0 (
    echo [ERRO] Servidor encerrado com erro (Codigo: %EXIT_CODE%)
    echo.
    echo [DEBUG] Possiveis causas do erro:
    echo   - Porta 5000 ja esta em uso
    echo   - Erro no banco de dados
    echo   - Dependencias corrompidas
    echo   - Falta de permissoes
    echo.
    echo [SOLUCAO] Tente as seguintes acoes:
    echo   1. Execute: npm install
    echo   2. Verifique se a porta 5000 esta livre
    echo   3. Execute como administrador
    echo.
) else (
    echo [OK] Servidor encerrado normalmente
)

echo.
echo [INFO] Informacoes do sistema:
echo   Base de dados: db/aih.db
echo   Backups: backups/
echo   Logs: logs/
echo   URL: http://localhost:5000
echo   Login: admin / admin123
echo.

:: Verificar se existem logs de erro recentes
if exist "logs\error*.log" (
    echo [DEBUG] Logs de erro encontrados:
    dir /b logs\error*.log
    echo.
)

:: Verificar se o banco existe
if exist "db\aih.db" (
    echo [OK] Banco de dados encontrado: db\aih.db
) else (
    echo [AVISO] Banco de dados nao encontrado: db\aih.db
    echo [INFO] O banco sera criado automaticamente na proxima execucao
)

echo.
echo [INFO] Pressione qualquer tecla para continuar...
echo [INFO] Ou feche esta janela se nao precisar de mais informacoes
pause >nul
