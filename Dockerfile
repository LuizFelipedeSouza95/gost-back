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

# Copiar primeiro package.json, yarn.lock e tsconfig.json para melhor cache de layers
COPY package.json ./
COPY yarn.lock* ./
COPY tsconfig.json ./

# Instalar dependências inicialmente
# IMPORTANTE: Instalar TODAS as dependências incluindo devDependencies para compilar TypeScript
# Configurar Yarn para tolerar instabilidade de rede (timeout de 10 minutos)
RUN echo "📦 Instalando dependências inicialmente..." && \
    yarn config set network-timeout 600000 && \
    yarn config set network-concurrency 1 && \
    yarn config set registry "https://registry.npmjs.org/" && \
    if [ -f yarn.lock ] && [ -s yarn.lock ]; then \
        echo "✅ yarn.lock encontrado, instalando com --frozen-lockfile" && \
        yarn install --frozen-lockfile --production=false || (echo "❌ ERRO: yarn install inicial falhou!" && exit 1); \
    else \
        echo "⚠️ yarn.lock não encontrado, instalando sem --frozen-lockfile" && \
        yarn install --production=false || (echo "❌ ERRO: yarn install inicial falhou!" && exit 1); \
    fi && \
    echo "✅ Verificando instalação inicial..." && \
    test -d node_modules || (echo "❌ ERRO: node_modules não foi criado!" && exit 1) && \
    echo "✅ Dependências iniciais instaladas"

# Copiar o código fonte (depois das dependências para melhor cache)
# IMPORTANTE: node_modules não será copiado devido ao .dockerignore
COPY . .

# Verificar se os arquivos necessários foram copiados
RUN echo "📁 Verificando arquivos copiados..." && \
    test -f /app/tsconfig.json || (echo "❌ Erro: tsconfig.json não encontrado!" && exit 1) && \
    test -d /app/src || (echo "❌ Erro: Diretório src não encontrado!" && exit 1) && \
    test -f /app/src/index.ts || (echo "❌ Erro: src/index.ts não encontrado!" && exit 1) && \
    echo "✅ Arquivos necessários encontrados" && \
    echo "📊 Tamanho do node_modules: $(du -sh node_modules 2>/dev/null | cut -f1 || echo 'não existe')"

# Verificar se TypeScript foi instalado corretamente
RUN echo "🔍 Verificando instalação do TypeScript..." && \
    test -d node_modules || (echo "❌ ERRO CRÍTICO: node_modules não existe!" && exit 1) && \
    test -d node_modules/.bin || (echo "❌ ERRO: node_modules/.bin não existe!" && exit 1) && \
    ls -la node_modules/.bin/tsc || (echo "❌ ERRO: tsc não encontrado em node_modules/.bin/" && ls -la node_modules/.bin/ | head -10 && exit 1) && \
    echo "✅ tsc encontrado em node_modules/.bin/" && \
    yarn tsc --version || (echo "❌ ERRO: yarn tsc não funciona" && exit 1) && \
    echo "✅ TypeScript instalado corretamente: $(yarn tsc --version)"

# Compilar TypeScript usando yarn (que garante que o PATH está correto)
RUN echo "🔨 Compilando TypeScript..." && \
    yarn build || (echo "❌ Erro ao compilar TypeScript!" && \
    echo "📋 Verificando node_modules:" && ls -la node_modules/.bin/ | grep tsc || echo "tsc não encontrado" && \
    echo "📋 Conteúdo do diretório atual:" && ls -la /app/ && \
    echo "📋 Conteúdo do src:" && ls -la /app/src/ && \
    echo "📋 Verificando package.json:" && cat package.json | grep -A 5 '"build"' && \
    exit 1) && \
    echo "✅ Build concluído"

# Verificar se o build foi bem-sucedido
# O TypeScript mantém a estrutura de diretórios, então src/index.ts vira dist/src/index.js
RUN echo "🔍 Verificando resultado do build..." && \
    ls -la /app/dist/ || (echo "❌ Erro: Diretório dist não foi criado!" && echo "📋 Conteúdo do diretório /app:" && ls -la /app/ && exit 1) && \
    test -f /app/dist/src/index.js || (echo "❌ Erro: dist/src/index.js não foi criado!" && echo "📋 Arquivos em dist:" && find /app/dist -name "*.js" -type f | head -20 && exit 1) && \
    echo "✅ Build concluído com sucesso. Arquivo principal:" && \
    ls -lh /app/dist/src/index.js

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
# O arquivo está em dist/src/index.js (estrutura mantida pelo TypeScript)
RUN test -f /app/dist/src/index.js || (echo "❌ Erro: dist/src/index.js não foi copiado!" && echo "📋 Conteúdo de dist:" && find /app/dist -type f -name "*.js" | head -20 && exit 1)
RUN echo "✅ Arquivo principal copiado:" && ls -lh /app/dist/src/index.js

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
    test -f /app/dist/src/index.js || (echo "❌ ERRO CRÍTICO: dist/src/index.js não existe!" && find /app/dist -name "*.js" -type f | head -10 && exit 1) && \
    echo "✅ Arquivo dist/src/index.js encontrado"

# Comando para iniciar a aplicação
# Como rootDir é ".", o arquivo está em dist/src/index.js
CMD ["node", "dist/src/index.js"]