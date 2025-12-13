# 🚀 Configuração do Backend no Vercel

Este guia explica como configurar o backend Express para deploy no Vercel.

## 📋 Pré-requisitos

1. Conta no Vercel
2. Repositório Git conectado
3. Banco de dados PostgreSQL (Vercel Postgres, Neon, Supabase, etc.)

## 🔧 Instalação de Dependências

Instale o pacote `@vercel/node` que é necessário para os tipos TypeScript:

```bash
cd BackEnd
yarn add @vercel/node
# ou
npm install @vercel/node
```

## 📁 Estrutura de Arquivos

A estrutura criada para o Vercel:

```
BackEnd/
├── api/
│   └── index.ts          # Handler serverless do Vercel
├── src/
│   └── ...               # Código fonte do backend
├── vercel.json           # Configuração do Vercel
└── package.json
```

## ⚙️ Configuração do vercel.json

O arquivo `vercel.json` está configurado para:

- **Build:** Compila TypeScript com `yarn build`
- **Routes:** Todas as rotas são direcionadas para `/api/index.ts`
- **Functions:** Configura a função serverless com runtime `@vercel/node` e timeout de 30s
- **Include Files:** Inclui arquivos compilados de `dist/**` (todos os arquivos necessários estão em `dist/` após o build)

**Importante:** Não use `outputDirectory` para projetos serverless-only. O Vercel detecta automaticamente que é um projeto serverless pela presença da pasta `api/`.

## 🌍 Variáveis de Ambiente no Vercel

Configure as seguintes variáveis de ambiente no painel do Vercel:

### Obrigatórias:
```
DATABASE_URL=postgresql://...
NODE_ENV=production
```

### URLs (configure seu domínio):
```
BACKEND_URL=https://api.seudominio.com.br
FRONTEND_URL=https://www.seudominio.com.br
CORS_ORIGIN=https://www.seudominio.com.br,https://seudominio.com.br
```

### Segurança:
```
SESSION_SECRET=seu-secret-super-seguro
JWT_SECRET=seu-jwt-secret-super-seguro
JWT_EXPIRES_IN=7d
```

### Outras (opcionais):
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://api.seudominio.com.br/api/auth/google/callback
AZURE_STORAGE_CONNECTION_STRING=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
LOG_LEVEL=info
```

## 🚀 Deploy

### Opção 1: Via Git (Recomendado)

1. Conecte seu repositório no Vercel
2. Configure o diretório raiz como `BackEnd`
3. Configure as variáveis de ambiente
4. Faça push para a branch principal

### Opção 2: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd BackEnd
vercel

# Deploy em produção
vercel --prod
```

## 🔍 Como Funciona

1. **Handler Serverless (`api/index.ts`):**
   - Inicializa o MikroORM uma vez (cache)
   - Cria o app Express uma vez (cache)
   - Converte requisições do Vercel para Express
   - Executa migrações automaticamente na primeira inicialização

2. **Rewrites (`vercel.json`):**
   - Todas as rotas são redirecionadas para `/api`
   - `/api/*` → função serverless
   - `/health` → função serverless
   - `/` → função serverless

3. **Build:**
   - Compila TypeScript para JavaScript
   - Gera arquivos em `dist/`
   - Inclui arquivos necessários na função serverless

## ✅ Verificação

Após o deploy, teste:

```bash
# Health check
curl https://seu-projeto.vercel.app/health

# API
curl https://seu-projeto.vercel.app/api

# Rotas específicas
curl https://seu-projeto.vercel.app/api/usuarios
```

## 🐛 Troubleshooting

### Erro: "Cannot find module '@vercel/node'"
```bash
yarn add @vercel/node
```

### Erro: "Cannot find module '../dist/src/server/app.js'"
- Verifique se o build foi executado (`yarn build`)
- Verifique se o arquivo `dist/src/server/app.js` existe
- Os imports no `api/index.ts` devem apontar para `dist/` após o build

### Erro: "No Output Directory named 'public' found"
- Remova `outputDirectory` do `vercel.json` (não é necessário para serverless functions)
- Use apenas `routes` em vez de `rewrites` para projetos serverless-only

### Erro de conexão com banco de dados
- Verifique se `DATABASE_URL` está configurada corretamente
- Verifique se o banco permite conexões externas
- Verifique se há firewall bloqueando conexões

### Timeout
- Aumente `maxDuration` no `vercel.json` (máximo 60s no plano Hobby)
- Otimize queries do banco de dados
- Use cache quando possível

### CORS
- Configure `CORS_ORIGIN` com todos os domínios permitidos
- Verifique se `FRONTEND_URL` está correto

## 📝 Notas Importantes

1. **Cache:** O ORM e app são cacheados entre requisições para melhor performance
2. **Migrações:** Executadas automaticamente na primeira inicialização
3. **Timeout:** Padrão de 30s (pode aumentar até 60s)
4. **Cold Start:** Primeira requisição pode demorar mais (inicialização do ORM)
5. **Variáveis de Ambiente:** Configure todas no painel do Vercel

## 🔗 Links Úteis

- [Documentação Vercel - Serverless Functions](https://vercel.com/docs/functions)
- [Documentação Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CLI](https://vercel.com/docs/cli)

