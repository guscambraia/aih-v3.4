
@echo off
chcp 65001 >nul
title Sistema AIH - Debug Detalhado

echo.
echo ===============================================================
echo                    SISTEMA AIH - DEBUG DETALHADO            
echo ===============================================================
echo.

:: Informações do sistema
echo [SISTEMA] Informações do ambiente:
echo   Data/Hora: %date% %time%
echo   Usuario: %username%
echo   Computador: %computername%
echo   SO: %os%
echo   Pasta: %cd%
echo.

:: Verificar Node.js
echo [NODE] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao instalado ou nao encontrado no PATH
    echo [SOLUCAO] Baixe e instale em: https://nodejs.org
    pause
    exit /b 1
) else (
    echo [OK] Node.js encontrado:
    node --version
    echo [OK] NPM encontrado:
    npm --version
)
echo.

:: Verificar estrutura de arquivos
echo [ARQUIVOS] Verificando estrutura do projeto...
if not exist "server.js" (
    echo [ERRO] server.js nao encontrado
    set ERRO_ESTRUTURA=1
) else (
    echo [OK] server.js encontrado
)

if not exist "package.json" (
    echo [ERRO] package.json nao encontrado
    set ERRO_ESTRUTURA=1
) else (
    echo [OK] package.json encontrado
)

if not exist "public" (
    echo [ERRO] pasta public nao encontrada
    set ERRO_ESTRUTURA=1
) else (
    echo [OK] pasta public encontrada
)

if defined ERRO_ESTRUTURA (
    echo.
    echo [ERRO] Estrutura de arquivos incorreta!
    echo [INFO] Voce esta na pasta correta do projeto?
    echo [INFO] Arquivos encontrados na pasta atual:
    dir /b
    echo.
    pause
    exit /b 1
)
echo.

:: Verificar dependências
echo [DEPS] Verificando dependencias...
if not exist "node_modules" (
    echo [AVISO] node_modules nao encontrado
    echo [INFO] Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo [ERRO] Falha na instalacao das dependencias
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas
) else (
    echo [OK] node_modules encontrado
)
echo.

:: Verificar portas
echo [REDE] Verificando porta 5000...
netstat -an | findstr :5000 >nul
if not errorlevel 1 (
    echo [AVISO] Porta 5000 ja esta em uso
    echo [INFO] Tentando liberar a porta...
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
        echo [INFO] Finalizando processo %%a
        taskkill /f /pid %%a >nul 2>&1
    )
) else (
    echo [OK] Porta 5000 disponivel
)
echo.

:: Verificar banco de dados
echo [BD] Verificando banco de dados...
if not exist "db" mkdir db
if exist "db\aih.db" (
    echo [OK] Banco de dados encontrado
    for %%I in (db\aih.db) do echo [INFO] Tamanho: %%~zI bytes
) else (
    echo [INFO] Banco sera criado na primeira execucao
)
echo.

:: Verificar logs
echo [LOGS] Verificando logs...
if not exist "logs" mkdir logs
if exist "logs\*.log" (
    echo [INFO] Logs encontrados:
    dir /b logs\*.log
) else (
    echo [INFO] Nenhum log encontrado
)
echo.

:: Tentar iniciar servidor com debug
echo [START] Iniciando servidor com debug...
echo ===============================================================
echo [DEBUG] Comando: node server.js
echo [DEBUG] Variaveis de ambiente:
echo   NODE_ENV=%NODE_ENV%
echo   PORT=%PORT%
echo.
echo [INFO] Pressione Ctrl+C para parar o servidor
echo [INFO] Aguarde a mensagem de inicializacao completa...
echo ===============================================================
echo.

:: Executar com captura de erro
node server.js 2>&1
set EXIT_CODE=%errorlevel%

echo.
echo ===============================================================
echo [RESULTADO] Servidor finalizado com codigo: %EXIT_CODE%
echo ===============================================================

if %EXIT_CODE% neq 0 (
    echo.
    echo [DIAGNOSTICO] Analise do erro:
    if %EXIT_CODE% equ 1 (
        echo   Codigo 1: Erro geral de aplicacao
        echo   - Verifique syntax errors no codigo
        echo   - Verifique se todas as dependencias estao instaladas
    )
    if %EXIT_CODE% equ 3221225786 (
        echo   Codigo 3221225786: Erro de aplicacao Windows
        echo   - Problema com dependencias nativas
        echo   - Tente reinstalar node_modules
    )
    echo.
    echo [SOLUCOES] Tente:
    echo   1. npm install --force
    echo   2. Deletar node_modules e fazer npm install
    echo   3. Verificar se ha espacos no caminho da pasta
    echo   4. Executar como administrador
    echo.
) else (
    echo [OK] Servidor encerrado normalmente
)

echo.
echo [INFO] Debug concluido. Pressione qualquer tecla para sair...
pause >nul
