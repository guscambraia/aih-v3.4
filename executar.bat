@echo off
chcp 65001 > nul
title Sistema AIH - Auditoria de AIH
color 0B

echo.
echo ====================================================================
echo                    SISTEMA AIH - AUDITORIA                     
echo                  Sistema de Controle de AIH                    
echo ====================================================================
echo.

REM Detectar diretorio atual automaticamente
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

echo Diretorio do projeto: %PROJECT_DIR%

REM Verificar se os arquivos essenciais existem
if not exist "%PROJECT_DIR%\server.js" (
    echo.
    echo ERRO: Arquivo server.js nao encontrado!
    echo Diretorio atual: %PROJECT_DIR%
    echo Certifique-se de estar executando o script na pasta correta
    echo.
    pause
    exit /b 1
)

if not exist "%PROJECT_DIR%\package.json" (
    echo ERRO: Arquivo package.json nao encontrado!
    pause
    exit /b 1
)

echo Arquivos essenciais encontrados

REM Verificar se Node.js esta instalado
echo.
echo Verificando pre-requisitos...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: Node.js nao foi encontrado no PATH do sistema!
    echo.
    echo SOLUCOES:
    echo    1. Baixe o Node.js em: https://nodejs.org/
    echo    2. Instale a versao LTS recomendada (v18 ou superior)
    echo    3. Reinicie o computador apos a instalacao
    echo    4. Verifique se Node.js foi adicionado ao PATH
    echo.
    pause
    exit /b 1
)

echo Node.js encontrado: 
node -v 2>nul
echo NPM versao: 
npm -v 2>nul

REM Verificar política de execução se estiver no PowerShell
if defined PSModulePath (
    echo 🔒 PowerShell detectado - verificando políticas de execução...
    powershell -Command "if ((Get-ExecutionPolicy) -eq 'Restricted') { Write-Host '⚠️  Política de execução restritiva detectada' }"
)

REM Navegar para o diretorio do projeto
cd /d "%PROJECT_DIR%"
echo Navegando para: %cd%

REM Verificar se as dependencias estao instaladas
if not exist "node_modules" (
    echo.
    echo Primeira execucao detectada!
    echo Instalando dependencias do sistema...
    echo.
    echo Executando: npm install
    npm install --no-audit --no-fund
    if errorlevel 1 (
        echo.
        echo ERRO: Falha na instalacao das dependencias!
        echo.
        echo POSSIVEIS SOLUCOES:
        echo    1. Verifique sua conexao com a internet
        echo    2. Execute como administrador
        echo    3. Limpe o cache: npm cache clean --force
        echo    4. Tente: npm install --legacy-peer-deps
        echo    5. Verifique se ha espaco suficiente em disco
        echo.
        pause
        exit /b 1
    )
    echo Dependencias instaladas com sucesso!
) else (
    echo Dependencias ja instaladas
)

REM Funcao para liberar porta 5000
echo.
echo Verificando porta 5000...
netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo Porta 5000 em uso! Tentando liberar...

    REM Tentar encerrar processos Node.js na porta 5000
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING 2^>nul') do (
        echo Encerrando processo PID %%i...
        taskkill /pid %%i /f >nul 2>&1
    )

    REM Aguardar e verificar novamente
    timeout /t 3 >nul

    netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
    if not errorlevel 1 (
        echo Alguns processos ainda estao usando a porta 5000
        echo O sistema tentara usar outra porta automaticamente
    ) else (
        echo Porta 5000 liberada com sucesso
    )
) else (
    echo Porta 5000 disponivel
)

REM Verificar/criar diretorio de banco de dados
if not exist "db" (
    echo Criando diretorio do banco de dados...
    mkdir db
)

REM Verificar se o banco de dados existe, se nao, inicializar
if not exist "db\aih.db" (
    echo.
    echo Primeira execucao - Inicializando banco de dados...
    node database.js
    if errorlevel 1 (
        echo ERRO: Erro ao inicializar banco de dados!
        echo Verifique se o arquivo database.js existe e esta correto
        pause
        exit /b 1
    )
    echo Banco de dados inicializado!
) else (
    echo Banco de dados encontrado
)

REM Verificar se arquivos de configuração existem
if not exist "config.js" (
    echo ⚠️  Arquivo config.js não encontrado, usando configurações padrão
)

REM Definir variaveis de ambiente
set NODE_ENV=production
set PORT=5000

REM Iniciar o servidor
echo.
echo INICIANDO SISTEMA AIH...
echo ========================================
echo.
echo Servidor sera iniciado em: http://localhost:5000
echo Login padrao: admin / admin
echo Para parar o servidor: Ctrl + C
echo Diretorio de trabalho: %cd%
echo Ambiente: %NODE_ENV%
echo.
echo Aguarde alguns segundos para o sistema inicializar...
echo.

REM Aguardar um momento e tentar abrir o navegador
timeout /t 3 >nul

REM Tentar abrir navegador (silencioso se falhar)
start "" "http://localhost:5000" >nul 2>&1

REM Adicionar timestamp
echo [%date% %time%] Iniciando servidor Node.js...

REM Iniciar o servidor Node.js com melhor tratamento de erros
echo Executando: node server.js
echo.
node server.js

REM Se chegou aqui, o servidor foi encerrado
set RETURN_CODE=%errorlevel%

echo.
echo ===============================================================
echo                    SERVIDOR ENCERRADO
echo ===============================================================
echo Codigo de saida: %RETURN_CODE%
echo Hora: %date% %time%
echo.

if %RETURN_CODE% neq 0 (
    echo O servidor encerrou com erro (codigo %RETURN_CODE%)
    echo.
    echo OPCOES DE DIAGNOSTICO:
    echo.
) else (
    echo O servidor foi encerrado normalmente
    echo.
    echo OPCOES DISPONIVEIS:
    echo.
)

echo 1. Reiniciar o servidor automaticamente
echo 2. Executar em modo debug (logs detalhados)
echo 3. Executar testes do sistema
echo 4. Verificar logs de erro
echo 5. Reinstalar dependências
echo 6. Limpar cache e reiniciar
echo 7. Verificar status do sistema
echo 8. Sair
echo.
set /p opcao="Digite sua escolha (1-8): "

if "%opcao%"=="1" goto :restart
if "%opcao%"=="2" goto :debug
if "%opcao%"=="3" goto :tests
if "%opcao%"=="4" goto :logs
if "%opcao%"=="5" goto :reinstall
if "%opcao%"=="6" goto :clean
if "%opcao%"=="7" goto :status
if "%opcao%"=="8" goto :end

echo Opcao invalida, saindo...
goto :end

:restart
echo.
echo Reiniciando servidor...
echo [%date% %time%] Solicitacao de reinicializacao
echo.
taskkill /f /im node.exe >nul 2>&1
timeout /t 3 >nul
"%~f0"
goto :end

:debug
echo.
echo Iniciando em modo debug...
if exist "debug-start.bat" (
    call debug-start.bat
) else (
    echo Executando debug manual...
    set DEBUG=* 
    set NODE_ENV=development
    node server.js
)
goto :end

:tests
echo.
echo 🧪 Executando testes...
if exist "executar-testes.bat" (
    call executar-testes.bat
) else (
    echo Executando testes manual...
    npm test 2>nul || echo Nenhum teste configurado
)
goto :end

:logs
echo.
echo 📋 Verificando logs...
if exist "logs" (
    echo Arquivos de log encontrados:
    dir logs\*.log /b 2>nul
    echo.
    for /f %%i in ('dir logs\*.log /b /o:d 2^>nul') do set "ultimo_log=%%i"
    if defined ultimo_log (
        echo === Últimas 20 linhas do log mais recente: logs\%ultimo_log% ===
        powershell -Command "Get-Content 'logs\%ultimo_log%' -Tail 20" 2>nul || (
            echo Usando type para exibir o arquivo...
            type "logs\%ultimo_log%" 2>nul
        )
    ) else (
        echo Nenhum arquivo de log encontrado no diretório logs
    )
) else (
    echo ℹ️ Nenhum diretório de logs encontrado.
    echo Verificando console output...
)
echo.
pause
goto :end

:reinstall
echo.
echo 📦 Reinstalando dependências...
echo Removendo node_modules...
rmdir /s /q node_modules 2>nul
echo Removendo package-lock.json...
del package-lock.json 2>nul
echo.
echo Instalando dependências...
npm install --no-audit --no-fund
if errorlevel 1 (
    echo ❌ Erro na reinstalação
    pause
) else (
    echo ✅ Dependências reinstaladas com sucesso
    echo.
    set /p continuar="Deseja reiniciar o servidor agora? (s/n): "
    if /i "%continuar%"=="s" goto :restart
)
goto :end

:clean
echo.
echo 🧹 Limpando cache e reiniciando...
echo Limpando cache do npm...
npm cache clean --force
echo Encerrando processos Node.js...
taskkill /f /im node.exe >nul 2>&1
echo Aguardando...
timeout /t 3 >nul
echo.
goto :restart

:status
echo.
echo 📊 VERIFICANDO STATUS DO SISTEMA...
echo.
echo === INFORMAÇÕES DO SISTEMA ===
echo Node.js: 
node -v 2>nul || echo ❌ Node.js não encontrado
echo NPM: 
npm -v 2>nul || echo ❌ NPM não encontrado
echo.
echo === ARQUIVOS ESSENCIAIS ===
if exist "server.js" (echo ✅ server.js) else (echo ❌ server.js)
if exist "package.json" (echo ✅ package.json) else (echo ❌ package.json)
if exist "database.js" (echo ✅ database.js) else (echo ❌ database.js)
if exist "node_modules" (echo ✅ node_modules) else (echo ❌ node_modules)
if exist "db\aih.db" (echo ✅ banco de dados) else (echo ❌ banco de dados)
echo.
echo === PROCESSOS ATIVOS NA PORTA 5000 ===
netstat -ano | findstr :5000 | findstr LISTENING || echo ℹ️ Nenhum processo na porta 5000
echo.
echo === ESPAÇO EM DISCO ===
dir /-c | findstr bytes
echo.
pause
goto :end

:main_start
REM Início principal (para reinicialização)
goto :restart

:end
echo.
echo Obrigado por usar o Sistema AIH!
echo.
echo DICAS UTEIS:
echo    Para executar: .\executar.bat (no PowerShell) ou executar.bat (no CMD)
echo    Para backups: Acesse Admin ^> Backup no sistema
echo    Para relatorios: Use a secao Relatorios
echo    Para suporte: Verifique os logs com a opção 4 deste menu
echo    Para testes: Execute executar-testes.bat
echo    Diretorio do projeto: %PROJECT_DIR%
echo.
echo SOLUCAO DE PROBLEMAS:
echo    PowerShell: Use .\executar.bat
echo    CMD: Use executar.bat
echo    Sempre execute como administrador quando possivel
echo    Verifique antivírus que podem bloquear scripts
echo.
pause