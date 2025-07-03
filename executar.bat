
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

REM Definir diretório do projeto
set PROJECT_DIR=C:\Projeto\aih-v3.4-master
echo 📁 Diretório do projeto: %PROJECT_DIR%

REM Verificar se o diretório existe
if not exist "%PROJECT_DIR%" (
    echo.
    echo ❌ ERRO: Diretório do projeto não encontrado!
    echo    Diretório esperado: %PROJECT_DIR%
    echo.
    echo 📌 SOLUÇÕES:
    echo    1. Verifique se o caminho está correto
    echo    2. Ajuste a variável PROJECT_DIR no início deste script
    echo    3. Certifique-se de que os arquivos foram extraídos corretamente
    echo.
    pause
    exit /b 1
)

REM Navegar para o diretório do projeto
cd /d "%PROJECT_DIR%"
echo ✅ Navegando para: %cd%

REM Verificar arquivos essenciais
if not exist "server.js" (
    echo ❌ ERRO: Arquivo server.js não encontrado no diretório!
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ❌ ERRO: Arquivo package.json não encontrado no diretório!
    pause
    exit /b 1
)

echo ✅ Arquivos essenciais encontrados

REM Verificar se Node.js está instalado
echo.
echo 🔍 Verificando pré-requisitos...
node -v >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERRO: Node.js não foi encontrado no sistema!
    echo.
    echo 📌 SOLUÇÃO:
    echo    1. Baixe o Node.js em: https://nodejs.org/
    echo    2. Instale a versão LTS recomendada (v18 ou superior)
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
    echo    🔄 Executando: npm install
    npm install
    if errorlevel 1 (
        echo.
        echo ❌ ERRO: Falha na instalação das dependências!
        echo.
        echo 💡 POSSÍVEIS SOLUÇÕES:
        echo    1. Verifique sua conexão com a internet
        echo    2. Execute como administrador
        echo    3. Limpe o cache: npm cache clean --force
        echo    4. Tente: npm install --legacy-peer-deps
        echo.
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas com sucesso!
) else (
    echo ✅ Dependências já instaladas
)

REM Verificar se a porta 5000 está em uso e liberar se necessário
echo.
echo 🔍 Verificando porta 5000...
netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Porta 5000 em uso! Tentando liberar...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING 2^>nul') do (
        echo    🔄 Encerrando processo PID %%i...
        taskkill /pid %%i /f >nul 2>&1
    )
    timeout /t 3 >nul
    echo ✅ Tentativa de liberação da porta 5000 concluída
) else (
    echo ✅ Porta 5000 disponível
)

REM Verificar/criar diretório de banco de dados
if not exist "db" (
    echo 🗄️ Criando diretório do banco de dados...
    mkdir db
)

REM Verificar se o banco de dados existe, se não, inicializar
if not exist "db\aih.db" (
    echo.
    echo 🗄️ Primeira execução - Inicializando banco de dados...
    node database.js
    if errorlevel 1 (
        echo ❌ Erro ao inicializar banco de dados!
        echo    Verifique se o arquivo database.js existe
        pause
        exit /b 1
    )
    echo ✅ Banco de dados inicializado!
) else (
    echo ✅ Banco de dados encontrado
)

REM Verificar se arquivo de configuração existe
if not exist "config.js" (
    echo ⚠️  Arquivo config.js não encontrado, o sistema pode não funcionar corretamente
)

REM Iniciar o servidor
echo.
echo 🚀 INICIANDO SISTEMA AIH...
echo ════════════════════════════════════════
echo.
echo 📍 Servidor será iniciado em: http://localhost:5000
echo 🔐 Login padrão: admin / admin
echo 📋 Para parar o servidor: Ctrl + C
echo 💻 Diretório atual: %cd%
echo.
echo ⏳ Aguarde alguns segundos para o sistema inicializar...
echo.

REM Aguardar um momento e tentar abrir o navegador
timeout /t 2 >nul

REM Tentar abrir navegador (silencioso se falhar)
start "" "http://localhost:5000" >nul 2>&1

REM Iniciar o servidor Node.js
echo 🔥 Executando: node server.js
echo.
node server.js

REM Se chegou aqui, o servidor foi encerrado
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
echo 5. Instalar dependências novamente
echo 6. Limpar cache e reiniciar
echo 7. Sair
echo.
set /p opcao="Digite sua escolha (1-7): "

if "%opcao%"=="1" (
    echo.
    echo 🔄 Reiniciando servidor...
    echo.
    goto :restart
)
if "%opcao%"=="2" (
    echo.
    echo 🐛 Iniciando em modo debug...
    if exist "debug-start.bat" (
        call debug-start.bat
    ) else (
        echo Executando em modo debug manual...
        set DEBUG=* && node server.js
    )
    goto :end
)
if "%opcao%"=="3" (
    echo.
    echo 🧪 Executando testes...
    if exist "executar-testes.bat" (
        call executar-testes.bat
    ) else (
        echo Executando testes manual...
        npm test
    )
    goto :end
)
if "%opcao%"=="4" (
    echo.
    echo 📋 Verificando logs...
    if exist "logs" (
        dir logs\*.log /b 2>nul
        echo.
        echo Último arquivo de log:
        for /f %%i in ('dir logs\*.log /b /o:d 2^>nul') do set "ultimo_log=%%i"
        if defined ultimo_log (
            echo Exibindo: logs\%ultimo_log%
            type "logs\%ultimo_log%" 2>nul
        )
    ) else (
        echo ℹ️ Nenhum diretório de logs encontrado.
    )
    echo.
    pause
    goto :end
)
if "%opcao%"=="5" (
    echo.
    echo 📦 Reinstalando dependências...
    rmdir /s /q node_modules 2>nul
    del package-lock.json 2>nul
    npm install
    if errorlevel 1 (
        echo ❌ Erro na reinstalação
        pause
    ) else (
        echo ✅ Dependências reinstaladas
    )
    goto :end
)
if "%opcao%"=="6" (
    echo.
    echo 🧹 Limpando cache e reiniciando...
    npm cache clean --force
    taskkill /f /im node.exe >nul 2>&1
    timeout /t 3 >nul
    goto :restart
)

goto :end

:restart
REM Limpar possíveis processos restantes
echo 🔄 Limpando processos anteriores...
taskkill /f /im node.exe >nul 2>&1
timeout /t 3 >nul

REM Navegar novamente para o diretório (garantir que estamos no lugar certo)
cd /d "%PROJECT_DIR%"

REM Reiniciar script
echo 🔁 Reiniciando sistema...
"%~f0"
exit /b

:end
echo.
echo 👋 Obrigado por usar o Sistema AIH!
echo.
echo 💡 DICAS ÚTEIS:
echo    • Para backups: Acesse Admin ^> Backup no sistema
echo    • Para relatórios: Use a seção Relatórios
echo    • Para suporte: Verifique os logs em debug-start.bat
echo    • Para testes: Execute executar-testes.bat
echo    • Diretório do projeto: %PROJECT_DIR%
echo.
echo 📧 Em caso de problemas persistentes:
echo    1. Verifique se tem permissões de administrador
echo    2. Confirme se o Node.js está na versão 18+ 
echo    3. Teste executar diretamente: cd "%PROJECT_DIR%" ^&^& npm start
echo.
pause
