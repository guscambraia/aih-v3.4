
@echo off
chcp 65001 >nul
title Sistema AIH - Servidor Local

:: Criar arquivo de log com timestamp
set LOG_FILE=log-execucao-%date:~-4,4%-%date:~-10,2%-%date:~-7,2%-%time:~0,2%-%time:~3,2%-%time:~6,2%.txt
set LOG_FILE=%LOG_FILE: =0%

echo [%date% %time%] ========================================== >> %LOG_FILE%
echo [%date% %time%] INICIO DA EXECUCAO DO SISTEMA AIH >> %LOG_FILE%
echo [%date% %time%] ========================================== >> %LOG_FILE%

echo.
echo ===============================================================
echo                    SISTEMA DE CONTROLE DE AIH               
echo                        Servidor Local                       
echo ===============================================================
echo.

echo [%date% %time%] Sistema iniciado >> %LOG_FILE%
echo [%date% %time%] Pasta atual: %CD% >> %LOG_FILE%
echo [%date% %time%] Usuario: %USERNAME% >> %LOG_FILE%

:: Verificar se o Node.js esta instalado
echo [%date% %time%] Verificando Node.js... >> %LOG_FILE%
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo [%date% %time%] ERRO: Node.js nao encontrado >> %LOG_FILE%
    echo [INFO] Instale o Node.js em: https://nodejs.org
    echo.
    echo [%date% %time%] Pausando para visualizacao do erro >> %LOG_FILE%
    pause
    exit /b 1
) else (
    echo [OK] Node.js encontrado
    echo [%date% %time%] Node.js encontrado >> %LOG_FILE%
    node --version >> %LOG_FILE% 2>&1
)

:: Matar processos existentes na porta 5000
echo [%date% %time%] Verificando processos na porta 5000... >> %LOG_FILE%
echo [INFO] Verificando processos na porta 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    echo [INFO] Finalizando processo %%a na porta 5000
    echo [%date% %time%] Finalizando processo %%a na porta 5000 >> %LOG_FILE%
    taskkill /f /pid %%a >nul 2>&1
)

:: Verificar se as dependencias estao instaladas
echo [%date% %time%] Verificando dependencias... >> %LOG_FILE%
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    echo [%date% %time%] node_modules nao encontrado, instalando... >> %LOG_FILE%
    
    echo [%date% %time%] Executando: npm install >> %LOG_FILE%
    npm install >> %LOG_FILE% 2>&1
    set NPM_EXIT_CODE=%errorlevel%
    echo [%date% %time%] npm install terminou com codigo: %NPM_EXIT_CODE% >> %LOG_FILE%
    
    if %NPM_EXIT_CODE% neq 0 (
        echo [ERRO] Erro ao instalar dependencias! Codigo: %NPM_EXIT_CODE%
        echo [%date% %time%] ERRO na instalacao das dependencias, codigo: %NPM_EXIT_CODE% >> %LOG_FILE%
        echo.
        echo [DEBUG] Verifique o arquivo de log: %LOG_FILE%
        echo [DEBUG] para mais detalhes sobre o erro de instalacao
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas
    echo [%date% %time%] Dependencias instaladas com sucesso >> %LOG_FILE%
    echo.
) else (
    echo [OK] node_modules encontrado
    echo [%date% %time%] node_modules ja existe >> %LOG_FILE%
)

:: Verificar se a pasta db existe
if not exist "db" (
    echo [INFO] Criando pasta do banco de dados...
    echo [%date% %time%] Criando pasta db >> %LOG_FILE%
    mkdir db
)

:: Verificar se a pasta logs existe
if not exist "logs" (
    echo [INFO] Criando pasta de logs...
    echo [%date% %time%] Criando pasta logs >> %LOG_FILE%
    mkdir logs
)

:: Verificar se a pasta backups existe
if not exist "backups" (
    echo [INFO] Criando pasta de backups...
    echo [%date% %time%] Criando pasta backups >> %LOG_FILE%
    mkdir backups
)

:: Verificar se o arquivo server.js existe
echo [%date% %time%] Verificando arquivo server.js... >> %LOG_FILE%
if not exist "server.js" (
    echo [ERRO] Arquivo server.js nao encontrado!
    echo [%date% %time%] ERRO: server.js nao encontrado >> %LOG_FILE%
    echo [INFO] Verifique se voce esta na pasta correta do projeto
    echo.
    pause
    exit /b 1
) else (
    echo [OK] server.js encontrado
    echo [%date% %time%] server.js encontrado >> %LOG_FILE%
)

echo [INFO] Pressione Ctrl+C para encerrar o servidor de forma segura
echo [INFO] O sistema executara backup automatico e limpeza ao encerrar
echo.
echo [INICIO] Iniciando servidor...
echo ===============================================================
echo.

echo [%date% %time%] Iniciando servidor Node.js... >> %LOG_FILE%
echo [%date% %time%] Comando: node server.js >> %LOG_FILE%

:: Iniciar o servidor com captura de output
node server.js >> %LOG_FILE% 2>&1
set SERVER_EXIT_CODE=%errorlevel%

:: Capturar o codigo de saida
echo [%date% %time%] Servidor encerrado com codigo: %SERVER_EXIT_CODE% >> %LOG_FILE%

:: Se chegou aqui, o servidor foi encerrado
echo.
echo ===============================================================
echo [FIM] Servidor encerrado - Codigo de saida: %SERVER_EXIT_CODE%
echo ===============================================================
echo.

:: Verificar se foi encerramento normal ou erro
if %SERVER_EXIT_CODE% neq 0 (
    echo [ERRO] Servidor encerrado com erro (Codigo: %SERVER_EXIT_CODE%)
    echo [%date% %time%] ERRO no servidor, codigo: %SERVER_EXIT_CODE% >> %LOG_FILE%
    echo.
    echo [DEBUG] Possiveis causas do erro:
    echo   - Porta 5000 ja esta em uso
    echo   - Erro no banco de dados
    echo   - Dependencias corrompidas
    echo   - Falta de permissoes
    echo   - Erro de syntax no codigo
    echo.
    echo [SOLUCAO] Tente as seguintes acoes:
    echo   1. Execute: npm install --force
    echo   2. Verifique se a porta 5000 esta livre
    echo   3. Execute como administrador
    echo   4. Verifique o log: %LOG_FILE%
    echo.
) else (
    echo [OK] Servidor encerrado normalmente
    echo [%date% %time%] Servidor encerrado normalmente >> %LOG_FILE%
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
    echo [%date% %time%] Banco de dados existe >> %LOG_FILE%
) else (
    echo [AVISO] Banco de dados nao encontrado: db\aih.db
    echo [INFO] O banco sera criado automaticamente na proxima execucao
    echo [%date% %time%] Banco de dados nao existe, sera criado >> %LOG_FILE%
)

echo.
echo ===============================================================
echo [LOG] Arquivo de log criado: %LOG_FILE%
echo [LOG] Este arquivo contem detalhes completos da execucao
echo ===============================================================
echo.
echo [INFO] Pressione qualquer tecla para continuar...
echo [INFO] Ou feche esta janela se nao precisar de mais informacoes

echo [%date% %time%] ========================================== >> %LOG_FILE%
echo [%date% %time%] FIM DA EXECUCAO >> %LOG_FILE%
echo [%date% %time%] ========================================== >> %LOG_FILE%

pause >nul
