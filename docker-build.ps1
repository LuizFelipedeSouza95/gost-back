# Script de build do Docker para Backend GOST Airsoft
# Garante que o build é executado do diretório correto

$ErrorActionPreference = "Stop"

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: package.json não encontrado!" -ForegroundColor Red
    Write-Host "Execute este script a partir do diretório BackEnd" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "yarn.lock")) {
    Write-Host "⚠️  Aviso: yarn.lock não encontrado!" -ForegroundColor Yellow
    Write-Host "O build pode falhar. Certifique-se de que yarn.lock existe." -ForegroundColor Yellow
}

Write-Host "🔨 Construindo imagem Docker..." -ForegroundColor Cyan
Write-Host "Diretório atual: $(Get-Location)" -ForegroundColor Gray

# Executar build do Docker
docker build -t gost-airsoft-backend .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
    Write-Host "Para executar o container:" -ForegroundColor Cyan
    Write-Host "  docker run -p 3001:3001 --env-file .env gost-airsoft-backend" -ForegroundColor Gray
} else {
    Write-Host "❌ Build falhou!" -ForegroundColor Red
    exit 1
}

