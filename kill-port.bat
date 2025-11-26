@echo off
echo 🔍 Procurando processos na porta 3001...
netstat -ano | findstr :3001
echo.
echo 🛑 Finalizando processos...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Finalizando PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)
echo.
echo ✅ Pronto! Agora você pode iniciar o servidor com: yarn dev
pause

