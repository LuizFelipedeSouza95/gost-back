# ==================================================
# Dockerfile para Backend GOST Airsoft
# ==================================================
# IMPORTANTE: Execute o build a partir do diretório BackEnd:
#   docker build -t gost-airsoft-backend .
# 
# O contexto do build deve incluir package.json e yarn.lock
# ==================================================

# ==================================================
# Estágio 1: Build (Compilação do TypeScript)
# ==================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependências do sistema necessárias
# Inclui Python e build-base para compilar dependências nativas como bcrypt
# Com retry para lidar com problemas de rede temporários
RUN for i in 1 2 3 4 5; do \
        apk update && \
        apk add --no-cache \
            postgresql-client \
            openssh-client \
            curl \
            python3 \
            build-base \
            ffmpeg \
            && rm -rf /var/cache/apk/* && \
        break || sleep 15; \
    done

# Copiar primeiro package.json e tsconfig.json para melhor cache de layers
COPY package.json ./
COPY tsconfig.json ./

# Instalar dependências inicialmente (sem --frozen-lockfile caso yarn.lock não exista)
# Configurar Yarn para tolerar instabilidade de rede (timeout de 10 minutos)
# Com retry para lidar com problemas de DNS intermitentes (EAI_AGAIN)
RUN for i in 1 2 3 4 5; do \
        yarn config set network-timeout 600000 && \
        yarn config set network-concurrency 1 && \
        yarn config set registry "https://registry.npmjs.org/" && \
        yarn install && \
        break || sleep 10; \
    done

# Copiar o código fonte (depois das dependências para melhor cache)
# Isso incluirá yarn.lock se estiver no contexto
COPY . .

# Verificar se os arquivos necessários foram copiados
RUN echo "📁 Verificando arquivos copiados..." && \
    ls -la /app/ && \
    test -f /app/tsconfig.json || (echo "❌ Erro: tsconfig.json não encontrado!" && exit 1) && \
    test -d /app/src || (echo "❌ Erro: Diretório src não encontrado!" && exit 1) && \
    test -f /app/src/index.ts || (echo "❌ Erro: src/index.ts não encontrado!" && exit 1) && \
    echo "✅ Arquivos necessários encontrados"

# Se yarn.lock foi copiado, reinstalar com --frozen-lockfile para garantir consistência
RUN if [ -f yarn.lock ] && [ -s yarn.lock ]; then \
        echo "yarn.lock encontrado, reinstalando com --frozen-lockfile para garantir consistência"; \
        for i in 1 2 3 4 5; do \
            yarn config set network-timeout 600000 && \
            yarn config set network-concurrency 1 && \
            yarn config set registry "https://registry.npmjs.org/" && \
            yarn install --frozen-lockfile && \
            break || sleep 10; \
        done; \
    fi

# Compilar TypeScript (Comando do package.json: tsc)
RUN echo "🔨 Compilando TypeScript..." && \
    yarn build || (echo "❌ Erro ao compilar TypeScript!" && echo "📋 Conteúdo do diretório atual:" && ls -la /app/ && echo "📋 Conteúdo do src:" && ls -la /app/src/ && exit 1) && \
    echo "✅ Build concluído"

# Verificar se o build foi bem-sucedido
RUN echo "🔍 Verificando resultado do build..." && \
    ls -la /app/dist/ || (echo "❌ Erro: Diretório dist não foi criado!" && echo "📋 Conteúdo do diretório /app:" && ls -la /app/ && exit 1) && \
    test -f /app/dist/index.js || (echo "❌ Erro: dist/index.js não foi criado!" && echo "📋 Arquivos em dist:" && ls -la /app/dist/ || echo "Diretório dist não existe" && exit 1) && \
    echo "✅ Build concluído com sucesso. Arquivos em dist:" && \
    ls -la /app/dist/ | head -20

# ==================================================
# Estágio 2: Produção (Execução)
# ==================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Instalar dependências de sistema para o ambiente de execução
# Inclui Python e build-base temporariamente para compilar bcrypt
# Depois removemos build-base para manter a imagem pequena
RUN for i in 1 2 3 4 5; do \
        apk update && \
        apk add --no-cache \
            postgresql-client \
            openssh-client \
            curl \
            python3 \
            build-base \
            ffmpeg \
            && rm -rf /var/cache/apk/* && \
        break || sleep 15; \
    done

# Copiar arquivos de dependências e instalar apenas dependências de produção
# Nota: yarn.lock pode não estar disponível no contexto Git, então instalamos sem --frozen-lockfile
# As versões corretas já foram instaladas no estágio builder
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Configurar Yarn para tolerar instabilidade de rede (timeout de 10 minutos)
# Com retry para lidar com problemas de DNS intermitentes (EAI_AGAIN)
# Instalar dependências de produção (sem --frozen-lockfile pois yarn.lock pode não estar disponível)
RUN for i in 1 2 3 4 5; do \
        yarn config set network-timeout 600000 && \
        yarn config set network-concurrency 1 && \
        yarn config set registry "https://registry.npmjs.org/" && \
        yarn install --production && \
        yarn cache clean && \
        break || sleep 10; \
    done && \
    # Remover ferramentas de build após instalação para manter imagem pequena
    apk del build-base && \
    rm -rf /var/cache/apk/*

# Copiar arquivos compilados (dist) com ownership correto
# Verificar se o diretório dist existe no builder antes de copiar
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Verificar se o arquivo foi copiado corretamente
RUN test -f /app/dist/index.js || (echo "❌ Erro: dist/index.js não foi copiado!" && ls -la /app/ && exit 1)
RUN echo "✅ Arquivos copiados com sucesso:" && ls -la /app/dist/ | head -10

# Copiar arquivos de configuração necessários
COPY --from=builder --chown=nodejs:nodejs /app/mikro-orm.config.ts ./

# Criar diretórios necessários com permissões corretas
RUN mkdir -p /app/logs /app/uploads /app/temp /app/temp/videos && \
    chown -R nodejs:nodejs /app/logs /app/uploads /app/temp

# Mudar para usuário não-root
USER nodejs

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Verificar se o arquivo existe antes de iniciar
RUN echo "🔍 Verificação final antes de iniciar:" && \
    test -f /app/dist/index.js || (echo "❌ ERRO CRÍTICO: dist/index.js não existe!" && ls -la /app/ && ls -la /app/dist/ 2>/dev/null || echo "Diretório dist não existe" && exit 1) && \
    echo "✅ Arquivo dist/index.js encontrado"

# Comando para iniciar a aplicação (do package.json: node dist/index.js)
# Usa node diretamente pois package.json tem "type": "module"
CMD ["node", "dist/index.js"]