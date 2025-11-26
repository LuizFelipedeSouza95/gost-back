# Guia de Configuração de Email

Este guia explica como obter e configurar as credenciais para envio de emails no sistema GOST Airsoft.

## Opções Disponíveis

### 1. Gmail (Recomendado para desenvolvimento/testes)

#### Passo a passo:

1. **Acesse sua conta Google**
   - Vá para: https://myaccount.google.com/
   - Faça login com sua conta Gmail

2. **Ative a verificação em duas etapas**
   - Vá em: Segurança → Verificação em duas etapas
   - Siga as instruções para ativar

3. **Gere uma Senha de App**
   - Vá em: Segurança → Verificação em duas etapas → Senhas de app
   - Ou acesse diretamente: https://myaccount.google.com/apppasswords
   - Selecione "App" → "Outro (nome personalizado)"
   - Digite: "GOST Airsoft Backend"
   - Clique em "Gerar"
   - **Copie a senha gerada** (16 caracteres sem espaços)

4. **Configure no .env**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=seu-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   SMTP_FROM=seu-email@gmail.com
   ```

**Nota:** Use a senha de app gerada, NÃO sua senha normal do Gmail.

---

### 2. Outlook/Hotmail

#### Passo a passo:

1. **Acesse sua conta Microsoft**
   - Vá para: https://account.microsoft.com/security
   - Faça login

2. **Ative a verificação em duas etapas**
   - Vá em: Segurança → Verificação em duas etapas
   - Ative se ainda não estiver

3. **Gere uma Senha de App**
   - Vá em: Segurança → Senhas de app
   - Ou: https://account.microsoft.com/security/app-passwords
   - Selecione "Outro" e digite "GOST Backend"
   - Clique em "Gerar"
   - **Copie a senha gerada**

4. **Configure no .env**
   ```env
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=seu-email@outlook.com
   SMTP_PASS=senha-de-app-gerada
   SMTP_FROM=seu-email@outlook.com
   ```

---

### 3. SendGrid (Recomendado para produção)

#### Passo a passo:

1. **Crie uma conta gratuita**
   - Acesse: https://signup.sendgrid.com/
   - Crie uma conta (plano gratuito permite até 100 emails/dia)

2. **Verifique seu domínio ou email**
   - Após criar a conta, vá em: Settings → Sender Authentication
   - Escolha verificar um email único ou seu domínio

3. **Crie uma API Key**
   - Vá em: Settings → API Keys
   - Clique em "Create API Key"
   - Dê um nome: "GOST Backend"
   - Permissões: "Full Access" ou "Mail Send"
   - **Copie a API Key gerada** (aparece apenas uma vez!)

4. **Configure no .env**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=sua-api-key-aqui
   SMTP_FROM=seu-email@seudominio.com
   ```

**Vantagens:**
- Mais confiável para produção
- Analytics de entrega
- Melhor reputação de IP
- Até 100 emails/dia no plano gratuito

---

### 4. Mailgun (Alternativa para produção)

#### Passo a passo:

1. **Crie uma conta**
   - Acesse: https://www.mailgun.com/
   - Plano gratuito: 5.000 emails/mês

2. **Verifique seu domínio**
   - Vá em: Sending → Domains
   - Adicione e verifique seu domínio

3. **Obtenha as credenciais SMTP**
   - Vá em: Sending → Domain Settings → SMTP credentials
   - Use o "Default SMTP Login" e "Default Password"

4. **Configure no .env**
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=postmaster@seu-dominio.mailgun.org
   SMTP_PASS=senha-smtp-do-mailgun
   SMTP_FROM=noreply@seu-dominio.com
   ```

---

### 5. Amazon SES (Para alta escala)

#### Passo a passo:

1. **Crie uma conta AWS**
   - Acesse: https://aws.amazon.com/ses/
   - Crie conta AWS (se não tiver)

2. **Verifique seu email/domínio**
   - No console SES, vá em: Verified identities
   - Verifique um email ou domínio

3. **Crie credenciais SMTP**
   - Vá em: SMTP settings → Create SMTP credentials
   - **Copie o usuário e senha SMTP**

4. **Configure no .env**
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=sua-chave-smtp-usuario
   SMTP_PASS=sua-chave-smtp-senha
   SMTP_FROM=noreply@seu-dominio.com
   ```

**Nota:** Substitua `us-east-1` pela região do seu SES.

---

## Configuração no Projeto

### 1. Crie/Edite o arquivo `.env` na raiz do BackEnd

```env
# Configurações de Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=noreply@gost.com
```

### 2. Variáveis de Ambiente Explicadas

- **SMTP_HOST**: Servidor SMTP do provedor
- **SMTP_PORT**: Porta SMTP (geralmente 587 para TLS ou 465 para SSL)
- **SMTP_SECURE**: `false` para TLS (porta 587) ou `true` para SSL (porta 465)
- **SMTP_USER**: Seu email ou usuário SMTP
- **SMTP_PASS**: Senha de app ou API key
- **SMTP_FROM**: Email remetente (pode ser diferente do SMTP_USER)

### 3. Teste a Configuração

Após configurar, reinicie o servidor backend. O sistema tentará inicializar o serviço de email automaticamente.

Se houver erro, verifique os logs do servidor.

---

## Recomendações

### Para Desenvolvimento/Testes:
- ✅ **Gmail** (mais fácil de configurar)
- ✅ **Outlook** (alternativa simples)

### Para Produção:
- ✅ **SendGrid** (melhor custo-benefício)
- ✅ **Mailgun** (boa alternativa)
- ✅ **Amazon SES** (para alta escala)

---

## Troubleshooting

### Erro: "Invalid login"
- Verifique se está usando senha de app (não senha normal)
- Confirme que a verificação em duas etapas está ativada

### Erro: "Connection timeout"
- Verifique firewall/proxy
- Confirme porta e host corretos
- Teste com `SMTP_SECURE=false` primeiro

### Emails não chegam
- Verifique pasta de spam
- Confirme que o email remetente está verificado
- Verifique logs do servidor para erros específicos

---

## Segurança

⚠️ **IMPORTANTE:**
- NUNCA commite o arquivo `.env` no Git
- Use senhas de app, nunca senhas principais
- Em produção, use variáveis de ambiente do servidor
- Considere usar serviços de email dedicados para produção

