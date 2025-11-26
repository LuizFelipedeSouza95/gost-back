# Configuração do Azure Blob Storage - Passo a Passo

Este guia irá te ajudar a configurar o Azure Blob Storage para armazenar as imagens da galeria.

## Pré-requisitos

- Uma conta Microsoft (pode criar gratuitamente em https://azure.microsoft.com/free/)
- Navegador web atualizado

---

## Passo 1: Criar Conta no Azure

1. Acesse https://portal.azure.com
2. Se não tiver conta, clique em **"Começar gratuitamente"** ou **"Criar uma conta"**
3. Siga o processo de criação (pode usar conta Microsoft, GitHub, etc.)
4. Complete a verificação de identidade se solicitado

---

## Passo 2: Criar uma Conta de Armazenamento (Storage Account)

1. No portal do Azure, clique no botão **"Criar um recurso"** (ou "Create a resource")
2. Na barra de pesquisa, digite **"Storage account"** e selecione **"Storage account"**
3. Clique em **"Criar"** (Create)

### Configurações da Storage Account:

- **Assinatura**: Selecione sua assinatura (pode ser "Free Trial" ou "Pay-As-You-Go")
- **Grupo de recursos**: 
  - Clique em **"Criar novo"** (Create new)
  - Nome: `gost-airsoft-rg` (ou qualquer nome de sua preferência)
  - Clique em **"OK"**
- **Nome da conta de armazenamento**: 
  - Digite um nome único (ex: `gostairsoftstorage` + números aleatórios)
  - O nome deve ter entre 3-24 caracteres, apenas letras minúsculas e números
  - Exemplo: `gostairsoftstorage123`
- **Região**: Selecione a região mais próxima (ex: `Brazil South` ou `East US`)
- **Performance**: Selecione **"Standard"**
- **Redundância**: Selecione **"LRS"** (Locally Redundant Storage) - mais barato
- **Clique em "Revisar + criar"** (Review + create)
- **Clique em "Criar"** (Create)

Aguarde alguns minutos até a criação ser concluída (você verá uma notificação).

---

## Passo 3: Obter a Connection String

1. Após a criação, clique em **"Ir para o recurso"** (Go to resource)
2. No menu lateral esquerdo, procure por **"Segurança + rede"** (Security + networking)
3. Clique em **"Chaves de acesso"** (Access keys)
4. Você verá duas chaves (key1 e key2). Clique no ícone de **"Copiar"** ao lado de **"Connection string"** da **key1**
5. **IMPORTANTE**: Guarde essa string em local seguro, você precisará dela no próximo passo

---

## Passo 4: Criar um Container (Pasta) para as Imagens

1. Ainda na página da Storage Account, no menu lateral esquerdo, clique em **"Contêineres"** (Containers)
2. Clique no botão **"+ Contêiner"** (+ Container)
3. Configure:
   - **Nome**: `galeria` (ou o nome que preferir)
   - **Nível de acesso público**: Selecione **"Blob"** (permite acesso público às imagens)
4. Clique em **"Criar"** (Create)

---

## Passo 5: Configurar no Backend

1. Abra o arquivo `.env` na pasta `BackEnd` do projeto
2. Adicione as seguintes variáveis:

```env
# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=cole_aqui_a_connection_string_copiada_no_passo_3
AZURE_STORAGE_CONTAINER_NAME=galeria
```

**Exemplo:**
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=gostairsoftstorage123;AccountKey=abc123xyz...;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=galeria
```

3. Salve o arquivo `.env`

---

## Passo 6: Verificar se Está Funcionando

1. Reinicie o servidor backend:
   ```bash
   cd BackEnd
   yarn dev
   ```

2. Se tudo estiver configurado corretamente, você verá o servidor iniciando normalmente
3. Se houver erro relacionado ao Azure, verifique:
   - Se a Connection String está correta (copiada completamente)
   - Se o nome do container está correto
   - Se não há espaços extras no `.env`

---

## Testando o Upload

1. Acesse a aplicação frontend
2. Faça login como administrador
3. Vá para a seção "Galeria"
4. Clique em "Adicionar Foto"
5. Selecione uma imagem e faça o upload
6. Se funcionar, a imagem aparecerá na galeria!

---

## Custos do Azure

### Plano Gratuito:
- **12 meses gratuitos** de Storage Account (5GB)
- **200GB de transferência de dados gratuita** por mês

### Após o período gratuito:
- **Armazenamento**: ~R$ 0,10 por GB/mês (LRS)
- **Transferência de dados**: Primeiros 5GB gratuitos, depois ~R$ 0,10 por GB

**Dica**: Para uma galeria pequena/média, os custos são muito baixos (geralmente menos de R$ 5/mês).

---

## Segurança

- **Nunca compartilhe** sua Connection String publicamente
- Mantenha o arquivo `.env` no `.gitignore` (já deve estar)
- Se suspeitar que sua chave foi comprometida:
  1. Vá para "Chaves de acesso" na Storage Account
  2. Clique em "Regenerar" na key1 ou key2
  3. Atualize o `.env` com a nova Connection String

---

## Troubleshooting

### Erro: "AZURE_STORAGE_CONNECTION_STRING não configurada"
- Verifique se adicionou a variável no `.env`
- Reinicie o servidor após adicionar

### Erro: "Container não encontrado"
- Verifique se o container foi criado no Azure
- Verifique se o nome no `.env` está correto (case-sensitive)

### Erro: "Access Denied"
- Verifique se o nível de acesso do container está como "Blob" (acesso público)
- Verifique se a Connection String está correta

### Imagens não aparecem
- Verifique se o container tem acesso público configurado
- Verifique se a URL da imagem está correta no banco de dados
- Abra a URL da imagem diretamente no navegador para testar

---

## Próximos Passos

Após configurar o Azure, você pode:
- Fazer upload de imagens pela interface web
- As imagens serão armazenadas automaticamente no Azure
- As URLs serão salvas no banco de dados
- As imagens estarão acessíveis publicamente via URL

---

## Suporte

Se tiver problemas:
1. Verifique os logs do servidor backend
2. Verifique o console do navegador (F12)
3. Verifique se todas as variáveis de ambiente estão configuradas
4. Consulte a documentação oficial: https://docs.microsoft.com/azure/storage/

