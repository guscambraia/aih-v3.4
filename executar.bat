
@echo off
chcp 65001 > nul
title Sistema AIH - Auditoria de AIH
color 0B

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    SISTEMA AIH - AUDITORIA                     ║
echo ║                  Sistema de Controle de AIH                    ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Verificar se Node.js está instalado
echo 🔍 Verificando pré-requisitos...
node -v >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERRO: Node.js não foi encontrado no sistema!
    echo.
    echo 📌 SOLUÇÃO:
    echo    1. Baixe o Node.js em: https://nodejs.org/
    echo    2. Instale a versão LTS recomendada
    echo    3. Reinicie o computador
    echo    4. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado: 
node -v
echo ✅ NPM versão: 
npm -v

REM Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo.
    echo 📦 Primeira execução detectada!
    echo 📦 Instalando dependências do sistema...
    echo.
    npm install
    if errorlevel 1 (
        echo.
        echo ❌ ERRO: Falha na instalação das dependências!
        echo.
        echo 💡 POSSÍVEIS SOLUÇÕES:
        echo    1. Verifique sua conexão com a internet
        echo    2. Execute como administrador
        echo    3. Limpe o cache: npm cache clean --force
        echo.
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas com sucesso!
)

REM Verificar se a porta 5000 está em uso e liberar se necessário
echo.
echo 🔍 Verificando porta 5000...
netstat -ano | findstr :5000 | findstr LISTENING >nul
if not errorlevel 1 (
    echo ⚠️  Porta 5000 em uso! Liberando...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
        echo    🔄 Encerrando processo PID %%i...
        taskkill /pid %%i /f >nul 2>&1
    )
    timeout /t 2 >nul
    echo ✅ Porta 5000 liberada!
)

REM Verificar se o banco de dados existe
if not exist "db\aih.db" (
    echo.
    echo 🗄️ Primeira execução - Inicializando banco de dados...
    node database.js
    if errorlevel 1 (
        echo ❌ Erro ao inicializar banco de dados!
        pause
        exit /b 1
    )
    echo ✅ Banco de dados inicializado!
)

REM Iniciar o servidor
echo.
echo 🚀 INICIANDO SISTEMA AIH...
echo ════════════════════════════════════════
echo.
echo 📍 Servidor será iniciado em: http://localhost:5000
echo 🔐 Login padrão: admin / admin
echo 📋 Para parar o servidor: Ctrl + C
echo.
echo ⏳ Aguarde alguns segundos para o sistema inicializar...
echo.

REM Aguardar um momento e abrir o navegador
start /B timeout 3 >nul && start http://localhost:5000

REM Iniciar o servidor Node.js
node server.js

REM Se o servidor parar, exibir opções
echo.
echo ═══════════════════════════════════════════════════════════════
echo                    SERVIDOR ENCERRADO
echo ═══════════════════════════════════════════════════════════════
echo.
echo O que deseja fazer?
echo.
echo 1. Reiniciar o servidor automaticamente
echo 2. Executar em modo debug (logs detalhados)
echo 3. Executar testes do sistema
echo 4. Verificar logs de erro
echo 5. Sair
echo.
set /p opcao="Digite sua escolha (1-5): "

if "%opcao%"=="1" (
    echo.
    echo 🔄 Reiniciando servidor...
    echo.
    goto :restart
)
if "%opcao%"=="2" (
    echo.
    echo 🐛 Iniciando em modo debug...
    call debug-start.bat
    goto :end
)
if "%opcao%"=="3" (
    echo.
    echo 🧪 Executando testes...
    call executar-testes.bat
    goto :end
)
if "%opcao%"=="4" (
    echo.
    echo 📋 Verificando logs...
    if exist "logs" (
        dir logs\*.log
        echo.
        echo Último arquivo de log:
        for /f %%i in ('dir logs\*.log /b /o:d') do set "ultimo_log=%%i"
        if defined ultimo_log (
            echo Exibindo: logs\%ultimo_log%
            type "logs\%ultimo_log%"
        )
    ) else (
        echo ℹ️ Nenhum log encontrado.
    )
    echo.
    pause
    goto :end
)

goto :end

:restart
REM Limpar possíveis processos restantes
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul
REM Reiniciar script
"%~f0"
exit /b

:end
echo.
echo 👋 Obrigado por usar o Sistema AIH!
echo.
echo 💡 DICAS ÚTEIS:
echo    • Para backups: Acesse Admin > Backup no sistema
echo    • Para relatórios: Use a seção Relatórios
echo    • Para suporte: Verifique os logs em debug-start.bat
echo    • Para testes: Execute executar-testes.bat
echo.
pause
