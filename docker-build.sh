#!/bin/bash
# Script de build do Docker para Backend GOST Airsoft
# Garante que o build é executado do diretório correto

set -e

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado!"
    echo "Execute este script a partir do diretório BackEnd"
    exit 1
fi

if [ ! -f "yarn.lock" ]; then
    echo "⚠️  Aviso: yarn.lock não encontrado!"
    echo "O build pode falhar. Certifique-se de que yarn.lock existe."
fi

echo "🔨 Construindo imagem Docker..."
echo "Diretório atual: $(pwd)"

# Executar build do Docker
docker build -t gost-airsoft-backend .

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo "Para executar o container:"
    echo "  docker run -p 3001:3001 --env-file .env gost-airsoft-backend"
else
    echo "❌ Build falhou!"
    exit 1
fi

