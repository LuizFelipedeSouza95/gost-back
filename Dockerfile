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

# Copiar primeiro package.json e yarn.lock para melhor cache de layers
# Se yarn.lock não estiver no contexto, o build falhará aqui
# Certifique-se de executar: docker build -t gost-airsoft-backend .
# a partir do diretório BackEnd que contém yarn.lock
COPY package.json yarn.lock ./

# Configurar Yarn para tolerar instabilidade de rede (timeout de 10 minutos)
# Instalar dependências (todas - incluindo devDependencies para build)
# Com retry para lidar com problemas de DNS intermitentes (EAI_AGAIN)
RUN for i in 1 2 3 4 5; do \
        yarn config set network-timeout 600000 && \
        yarn config set network-concurrency 1 && \
        yarn config set registry "https://registry.npmjs.org/" && \
        yarn install --frozen-lockfile && \
        break || sleep 10; \
    done

# Copiar o código fonte (depois das dependências para melhor cache)
COPY . .

# Compilar TypeScript (Comando do package.json: tsc)
RUN yarn build

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
COPY --from=builder --chown=nodejs:nodejs /app/package.json /app/yarn.lock ./

# Configurar Yarn para tolerar instabilidade de rede (timeout de 10 minutos)
# Com retry para lidar com problemas de DNS intermitentes (EAI_AGAIN)
RUN for i in 1 2 3 4 5; do \
        yarn config set network-timeout 600000 && \
        yarn config set network-concurrency 1 && \
        yarn config set registry "https://registry.npmjs.org/" && \
        yarn install --production --frozen-lockfile && \
        yarn cache clean && \
        break || sleep 10; \
    done && \
    # Remover ferramentas de build após instalação para manter imagem pequena
    apk del build-base && \
    rm -rf /var/cache/apk/*

# Copiar arquivos compilados (dist) com ownership correto
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

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

# Comando para iniciar a aplicação (do package.json: node dist/index.js)
CMD ["node", "dist/index.js"]