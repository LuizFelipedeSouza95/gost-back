# Script PowerShell para matar processo na porta 3001
# Uso: .\kill-port.ps1 ou .\kill-port.ps1 -Port 3001

param(
    [int]$Port = 3001
)

Write-Host "🔍 Procurando processos na porta $Port..." -ForegroundColor Yellow

$connections = netstat -ano | findstr ":$Port"
if ($connections) {
    $pids = $connections | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') {
            $matches[1]
        }
    } | Sort-Object -Unique
    
    foreach ($pid in $pids) {
        Write-Host "🛑 Finalizando processo PID: $pid" -ForegroundColor Red
        taskkill /F /PID $pid 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Processo $pid finalizado com sucesso" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Não foi possível finalizar o processo $pid" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "✅ Nenhum processo encontrado na porta $Port" -ForegroundColor Green
}

Write-Host "`n💡 Agora você pode iniciar o servidor com: yarn dev" -ForegroundColor Cyan

