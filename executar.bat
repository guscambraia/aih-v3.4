
@echo off
title Sistema AIH - Inicializando...

REM Detectar o diretorio onde o script esta localizado
cd /d "%~dp0"

REM Verificar se estamos no diretorio correto
if not exist "server.js" (
    echo.
    echo ERRO: Nao foi possivel encontrar os arquivos do sistema AIH
    echo    Certifique-se de que o script esta na pasta correta
    echo.
    echo Diretorio atual: %cd%
    echo.
    pause
    exit /b 1
)

REM Verificar Node.js rapidamente
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo Node.js nao encontrado! 
    echo    Instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Limpar console e mostrar cabecalho
cls
echo.
echo ================================================================
echo                    SISTEMA AIH - INICIANDO                    
echo ================================================================
echo.

REM Instalar dependencias se necessario
if not exist "node_modules" (
    echo Instalando dependencias... Aguarde...
    npm install --silent --no-progress >nul 2>&1
    if errorlevel 1 (
        echo ERRO: Erro na instalacao. Execute: npm install
        pause
        exit /b 1
    )
    echo Dependencias instaladas!
)

REM Liberar porta 5000 se ocupada
netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo Liberando porta 5000...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING 2^>nul') do (
        taskkill /pid %%i /f >nul 2>&1
    )
    timeout /t 2 >nul
)

REM Verificar/criar banco de dados
if not exist "db" mkdir db >nul 2>&1
if not exist "db\aih.db" (
    echo Inicializando banco de dados...
    node database.js >nul 2>&1
)

REM Iniciar sistema
echo Iniciando Sistema AIH...
echo.
echo URL: http://localhost:5000
echo Login: admin / admin
echo.
echo Aguarde... O navegador abrira automaticamente!
echo.

REM Aguardar 3 segundos e abrir navegador
timeout /t 3 >nul
start "" "http://localhost:5000" >nul 2>&1

REM Iniciar servidor
echo Servidor iniciando...
node server.js

REM Se o servidor parar
echo.
echo ===============================================================
echo                    SERVIDOR ENCERRADO
echo ===============================================================
echo.

:menu
echo OPCOES DISPONIVEIS:
echo.
echo 1. Reiniciar o servidor
echo 2. Verificar logs
echo 3. Reinstalar dependencias
echo 4. Limpar cache
echo 5. Verificar status
echo 6. Sair
echo.

set /p "opcao=Digite sua escolha (1-6): "

if "%opcao%"=="1" (
    echo.
    echo Reiniciando servidor...
    goto inicio
)

if "%opcao%"=="2" (
    echo.
    echo Verificando logs...
    if exist "logs" (
        dir logs\*.log 2>nul && (
            echo Arquivos de log encontrados:
            dir logs\*.log /b
        ) || (
            echo Nenhum arquivo de log encontrado
        )
    ) else (
        echo Nenhum diretorio de logs encontrado
    )
    echo.
    pause
    goto menu
)

if "%opcao%"=="3" (
    echo.
    echo Reinstalando dependencias...
    if exist "node_modules" rmdir /s /q "node_modules" >nul 2>&1
    if exist "package-lock.json" del "package-lock.json" >nul 2>&1
    npm install
    if errorlevel 0 (
        echo Dependencias reinstaladas com sucesso
        set /p "continuar=Deseja reiniciar o servidor agora? (s/n): "
        if /i "%continuar%"=="s" goto inicio
    ) else (
        echo ERRO: Erro na reinstalacao
    )
    goto menu
)

if "%opcao%"=="4" (
    echo.
    echo Limpando cache...
    npm cache clean --force
    echo Cache limpo
    pause
    goto menu
)

if "%opcao%"=="5" (
    echo.
    echo VERIFICANDO STATUS DO SISTEMA...
    echo.
    echo === INFORMACOES DO SISTEMA ===
    node --version 2>nul && echo Node.js OK || echo Node.js nao encontrado
    npm --version 2>nul && echo NPM OK || echo NPM nao encontrado
    echo.
    echo === ARQUIVOS ESSENCIAIS ===
    if exist "server.js" (echo server.js OK) else (echo server.js FALTANDO)
    if exist "package.json" (echo package.json OK) else (echo package.json FALTANDO)
    if exist "database.js" (echo database.js OK) else (echo database.js FALTANDO)
    if exist "node_modules" (echo node_modules OK) else (echo node_modules FALTANDO)
    if exist "db\aih.db" (echo db\aih.db OK) else (echo db\aih.db FALTANDO)
    echo.
    echo === PROCESSOS NA PORTA 5000 ===
    netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1 && (
        echo Processos encontrados na porta 5000
        netstat -ano | findstr :5000
    ) || (
        echo Nenhum processo na porta 5000
    )
    echo.
    pause
    goto menu
)

if "%opcao%"=="6" (
    goto sair
)

echo Opcao invalida, tente novamente
goto menu

:inicio
cls
goto main

:main
REM Verificar se estamos no diretorio correto
if not exist "server.js" (
    echo.
    echo ERRO: Nao foi possivel encontrar os arquivos do sistema AIH
    echo    Certifique-se de que o script esta na pasta correta
    echo.
    echo Diretorio atual: %cd%
    echo.
    pause
    exit /b 1
)

REM Liberar porta 5000 se ocupada
netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo Liberando porta 5000...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING 2^>nul') do (
        taskkill /pid %%i /f >nul 2>&1
    )
    timeout /t 2 >nul
)

echo Executando: node server.js
node server.js
goto menu

:sair
echo.
echo Obrigado por usar o Sistema AIH!
echo.
echo DICAS UTEIS:
echo    - Para executar: executar.bat
echo    - Para PowerShell: .\executar.bat
echo    - Execute sempre da pasta do projeto
echo    - URL do sistema: http://localhost:5000
echo.
echo SOLUCAO DE PROBLEMAS:
echo    - Verifique se Node.js esta instalado
echo    - Execute como administrador quando necessario
echo    - Certifique-se de estar na pasta correta
echo.
pause
