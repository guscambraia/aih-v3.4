
@echo off
chcp 65001 > nul
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    SISTEMA AIH - LIMPEZA COMPLETA              ║
echo ║                        ZERAR BASE DE DADOS                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo ⚠️  ATENÇÃO: Este processo irá REMOVER TODOS OS DADOS da base!
echo.
echo 📋 O que será feito:
echo    • Backup automático antes da limpeza
echo    • Remoção de todas as AIHs, movimentações e glosas
echo    • Remoção de todos os usuários
echo    • Recriação do administrador padrão (admin/admin)
echo    • Otimização completa do banco de dados
echo.

set /p confirma="🤔 Tem certeza que deseja continuar? (S/N): "
if /i not "%confirma%"=="S" (
    echo.
    echo ❌ Operação cancelada pelo usuário.
    echo.
    pause
    exit /b 1
)

echo.
echo 🚀 Iniciando limpeza completa da base de dados...
echo.

node zerar-base-dados.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCESSO: Base de dados zerada e pronta para uso profissional!
    echo.
    echo 📌 PRÓXIMOS PASSOS:
    echo    1. Acesse o sistema com admin/admin
    echo    2. Altere a senha do administrador
    echo    3. Cadastre os usuários da sua equipe
    echo    4. Configure os profissionais auditores
    echo    5. Comece o cadastro das AIHs
    echo.
) else (
    echo.
    echo ❌ ERRO: Falha na limpeza da base de dados.
    echo    Verifique os logs acima para detalhes.
    echo.
)

echo.
pause
