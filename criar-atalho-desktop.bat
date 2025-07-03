
@echo off
title Criando Atalho - Sistema AIH
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║              CRIANDO ATALHO NA ÁREA DE TRABALHO                   ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.

REM Detectar o caminho atual onde está o executar.bat
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM Caminho do arquivo executar.bat
set "EXECUTAR_BAT=%SCRIPT_DIR%\executar.bat"

REM Verificar se o arquivo executar.bat existe
if not exist "%EXECUTAR_BAT%" (
    echo ❌ ERRO: Arquivo executar.bat não encontrado!
    echo    Procurando em: %EXECUTAR_BAT%
    echo.
    pause
    exit /b 1
)

echo ✅ Arquivo executar.bat encontrado em: %EXECUTAR_BAT%
echo.

REM Obter o caminho da área de trabalho
for /f "tokens=2*" %%a in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" /v Desktop 2^>nul') do set "DESKTOP_PATH=%%b"

REM Expandir variáveis de ambiente no caminho da área de trabalho
call set "DESKTOP_PATH=%DESKTOP_PATH%"

REM Se não conseguir pelo registry, usar caminho padrão
if not exist "%DESKTOP_PATH%" (
    set "DESKTOP_PATH=%USERPROFILE%\Desktop"
)

REM Verificar se a área de trabalho existe
if not exist "%DESKTOP_PATH%" (
    echo ❌ ERRO: Não foi possível encontrar a área de trabalho!
    echo    Tentamos: %DESKTOP_PATH%
    echo.
    pause
    exit /b 1
)

echo ✅ Área de trabalho encontrada: %DESKTOP_PATH%
echo.

REM Nome do atalho
set "ATALHO_NOME=Sistema AIH"
set "ATALHO_PATH=%DESKTOP_PATH%\%ATALHO_NOME%.lnk"

echo 🔄 Criando atalho na área de trabalho...

REM Criar arquivo temporário com script PowerShell
echo $ws = New-Object -ComObject WScript.Shell > "%TEMP%\criar_atalho.ps1"
echo $shortcut = $ws.CreateShortcut('%ATALHO_PATH%') >> "%TEMP%\criar_atalho.ps1"
echo $shortcut.TargetPath = '%EXECUTAR_BAT%' >> "%TEMP%\criar_atalho.ps1"
echo $shortcut.WorkingDirectory = '%SCRIPT_DIR%' >> "%TEMP%\criar_atalho.ps1"
echo $shortcut.Description = 'Sistema AIH - Auditoria de AIH' >> "%TEMP%\criar_atalho.ps1"
echo $shortcut.IconLocation = '%SystemRoot%\System32\shell32.dll,21' >> "%TEMP%\criar_atalho.ps1"
echo $shortcut.WindowStyle = 1 >> "%TEMP%\criar_atalho.ps1"
echo $shortcut.Save() >> "%TEMP%\criar_atalho.ps1"

REM Executar o script PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -File "%TEMP%\criar_atalho.ps1"

REM Limpar arquivo temporário
del "%TEMP%\criar_atalho.ps1" >nul 2>&1

REM Verificar se o atalho foi criado
if exist "%ATALHO_PATH%" (
    echo.
    echo ✅ ATALHO CRIADO COM SUCESSO!
    echo.
    echo 📍 Localização: %ATALHO_PATH%
    echo 🎯 Nome: %ATALHO_NOME%
    echo 📂 Executa: %EXECUTAR_BAT%
    echo 🏠 Pasta de trabalho: %SCRIPT_DIR%
    echo.
    echo ═══════════════════════════════════════════════════════════════════
    echo                        COMO USAR O ATALHO
    echo ═══════════════════════════════════════════════════════════════════
    echo.
    echo 1. 🖱️  Vá para a área de trabalho
    echo 2. 🔍 Procure pelo atalho "%ATALHO_NOME%"
    echo 3. 👆 Clique duas vezes no atalho
    echo 4. 🚀 O Sistema AIH será iniciado automaticamente
    echo 5. 🌐 O navegador abrirá em http://localhost:5000
    echo 6. 🔐 Use: admin / admin para fazer login
    echo.
    echo ═══════════════════════════════════════════════════════════════════
    echo.
    
    REM Perguntar se quer abrir a área de trabalho
    set /p abrir="Deseja abrir a área de trabalho para ver o atalho? (s/n): "
    if /i "%abrir%"=="s" (
        echo.
        echo 🔄 Abrindo área de trabalho...
        explorer "%DESKTOP_PATH%"
    )
    
    echo.
    echo 💡 DICAS IMPORTANTES:
    echo    • O atalho sempre executará o arquivo da pasta atual
    echo    • Não mova os arquivos do sistema sem recriar o atalho
    echo    • Para atualizar o sistema, substitua os arquivos e o atalho continua funcionando
    echo    • Para remover o atalho, apenas delete-o da área de trabalho
    echo.
    
) else (
    echo.
    echo ❌ ERRO: Não foi possível criar o atalho!
    echo.
    echo 🔧 SOLUÇÕES ALTERNATIVAS:
    echo.
    echo OPÇÃO 1 - Criar atalho manualmente:
    echo 1. Clique com botão direito na área de trabalho
    echo 2. Selecione "Novo" ^> "Atalho"
    echo 3. Cole este caminho: %EXECUTAR_BAT%
    echo 4. Clique "Avançar"
    echo 5. Nome: Sistema AIH
    echo 6. Clique "Concluir"
    echo.
    echo OPÇÃO 2 - Arrastar e soltar:
    echo 1. Abra a pasta: %SCRIPT_DIR%
    echo 2. Arraste o arquivo "executar.bat" para a área de trabalho
    echo 3. Escolha "Criar atalhos aqui"
    echo.
)

echo.
echo 🎯 INFORMAÇÕES DO SISTEMA:
echo    • Pasta do projeto: %SCRIPT_DIR%
echo    • Arquivo principal: %EXECUTAR_BAT%
echo    • Área de trabalho: %DESKTOP_PATH%
echo    • Atalho criado: %ATALHO_PATH%
echo.

pause
