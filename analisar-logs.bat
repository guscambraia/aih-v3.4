
@echo off
chcp 65001 >nul
title Analisador de Logs - Sistema AIH

echo.
echo ===============================================================
echo                    ANALISADOR DE LOGS DO SISTEMA AIH        
echo ===============================================================
echo.

:: Listar todos os arquivos de log
echo [INFO] Arquivos de log encontrados:
echo.
for %%f in (log-execucao-*.txt) do (
    echo   📄 %%f
    echo      Tamanho: %%~zf bytes
    echo      Data: %%~tf
    echo.
)

:: Verificar se existem logs
if not exist "log-execucao-*.txt" (
    echo [AVISO] Nenhum arquivo de log encontrado
    echo [INFO] Execute primeiro o arquivo executar.bat para gerar logs
    echo.
    pause
    exit /b 0
)

echo.
echo [OPCOES] Escolha uma opcao:
echo   1 - Ver o log mais recente
echo   2 - Ver todos os logs
echo   3 - Procurar por erros
echo   4 - Limpar logs antigos
echo   5 - Analisar problemas comuns
echo.

set /p opcao="Digite o numero da opcao: "

if "%opcao%"=="1" goto ver_recente
if "%opcao%"=="2" goto ver_todos
if "%opcao%"=="3" goto procurar_erros
if "%opcao%"=="4" goto limpar_logs
if "%opcao%"=="5" goto analisar_problemas
goto fim

:ver_recente
echo.
echo [LOG] Exibindo o log mais recente:
echo ===============================================================
for /f %%i in ('dir /b /od log-execucao-*.txt') do set ultimo=%%i
type "%ultimo%"
goto fim

:ver_todos
echo.
echo [LOG] Exibindo todos os logs:
echo ===============================================================
for %%f in (log-execucao-*.txt) do (
    echo.
    echo ========== %%f ==========
    type "%%f"
    echo.
)
goto fim

:procurar_erros
echo.
echo [ERRO] Procurando por erros nos logs:
echo ===============================================================
for %%f in (log-execucao-*.txt) do (
    echo.
    echo === Erros em %%f ===
    findstr /i "erro error failed exception" "%%f"
)
goto fim

:limpar_logs
echo.
echo [LIMPEZA] Removendo logs antigos...
del log-execucao-*.txt
echo [OK] Logs removidos
goto fim

:analisar_problemas
echo.
echo [ANALISE] Problemas comuns detectados:
echo ===============================================================

:: Verificar se Node.js foi encontrado
findstr /i "Node.js nao encontrado" log-execucao-*.txt >nul
if not errorlevel 1 (
    echo ❌ PROBLEMA: Node.js nao instalado
    echo    SOLUCAO: Instale Node.js em https://nodejs.org
    echo.
)

:: Verificar erros de npm install
findstr /i "npm install terminou com codigo" log-execucao-*.txt >nul
if not errorlevel 1 (
    echo ❌ PROBLEMA: Erro na instalacao de dependencias
    echo    SOLUCAO: Execute 'npm cache clean --force' e tente novamente
    echo.
)

:: Verificar erro de porta em uso
findstr /i "EADDRINUSE" log-execucao-*.txt >nul
if not errorlevel 1 (
    echo ❌ PROBLEMA: Porta 5000 ja esta em uso
    echo    SOLUCAO: Feche outros programas ou mate processo na porta 5000
    echo.
)

:: Verificar se server.js nao foi encontrado
findstr /i "server.js nao encontrado" log-execucao-*.txt >nul
if not errorlevel 1 (
    echo ❌ PROBLEMA: Arquivo server.js nao encontrado
    echo    SOLUCAO: Verifique se esta na pasta correta do projeto
    echo.
)

echo [INFO] Analise concluida

:fim
echo.
echo ===============================================================
echo [INFO] Pressione qualquer tecla para sair...
pause >nul
