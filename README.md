# GOST Airsoft - Backend

Backend do projeto GOST Airsoft desenvolvido com Node.js, Express, TypeScript e MikroORM.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Superset JavaScript com tipagem
- **MikroORM** - ORM para TypeScript
- **PostgreSQL** - Banco de dados
- **Pino** - Logger rápido
- **Helmet** - Segurança HTTP
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - Proteção contra abuso

## 📁 Estrutura do Projeto

```
BackEnd/
├── src/
│   ├── config/          # Configurações (CORS, etc)
│   ├── controllers/     # Controllers da aplicação
│   ├── middlewares/     # Middlewares customizados
│   ├── routes/          # Definição de rotas
│   ├── services/        # Lógica de negócio
│   ├── server/          # Configuração do servidor Express
│   └── index.ts         # Ponto de entrada da aplicação
├── server/
│   ├── config/          # Configuração do MikroORM
│   ├── entities/        # Entidades do banco de dados
│   └── migrations/      # Migrações do banco de dados
├── dist/                # Código compilado (gerado)
├── .env                 # Variáveis de ambiente (não versionado)
├── .env.example         # Exemplo de variáveis de ambiente
├── package.json         # Dependências do projeto
└── tsconfig.json        # Configuração do TypeScript
```

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
yarn install
# ou
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/gost_airsoft
PORT=3000
NODE_ENV=development
```

## 🏃 Executando o Projeto

### Desenvolvimento
```bash
yarn dev
# ou
npm run dev
```

### Produção
```bash
yarn build
yarn start
# ou
npm run build
npm start
```

## 📝 Criando Rotas

### 1. Criar um Controller

```typescript
// src/controllers/usuario.controller.ts
import { Request, Response } from 'express';
import { BaseController } from './base.controller.js';

export class UsuarioController extends BaseController {
  async index(req: Request, res: Response): Promise<Response> {
    // Sua lógica aqui
    return this.success(res, { usuarios: [] });
  }

  async create(req: Request, res: Response): Promise<Response> {
    // Sua lógica aqui
    return this.success(res, { message: 'Usuário criado' }, 201);
  }
}
```

### 2. Criar um Service (opcional)

```typescript
// src/services/usuario.service.ts
import { EntityManager } from '@mikro-orm/core';
import { BaseService } from './base.service.js';
import { Usuario } from '../../server/entities/usuarios.entity.js';

export class UsuarioService extends BaseService<Usuario> {
  constructor(em: EntityManager) {
    super(em, Usuario);
  }

  // Métodos customizados aqui
}
```

### 3. Criar as Rotas

```typescript
// src/routes/usuario.routes.ts
import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller.js';

const router = Router();
const usuarioController = new UsuarioController();

router.get('/', usuarioController.index.bind(usuarioController));
router.post('/', usuarioController.create.bind(usuarioController));

export default router;
```

### 4. Registrar as Rotas

```typescript
// src/routes/index.ts
import { Router } from 'express';
import usuarioRoutes from './usuario.routes.js';

const router = Router();

router.use('/usuarios', usuarioRoutes);

export default router;
```

## 🗄️ Migrações

### Criar uma migração
```bash
yarn migration:create
```

### Executar migrações pendentes
```bash
yarn migration:up
```

### Reverter última migração
```bash
yarn migration:down
```

### Listar migrações
```bash
yarn migration:list
```

## 🔒 Segurança

- **Helmet** - Configurado para proteger headers HTTP
- **CORS** - Configurado para permitir apenas origens específicas
- **Rate Limiting** - Limite de 300 requisições por 15 minutos por IP
- **Request ID** - Rastreamento de requisições para debugging

## 📊 Health Check

O servidor possui um endpoint de health check:
```
GET /health
```

Retorna o status do servidor e da conexão com o banco de dados.

## 🐛 Debugging

O projeto usa **Pino** para logging. Em desenvolvimento, os logs são formatados de forma legível.

Para ver logs detalhados, configure:
```env
LOG_LEVEL=debug
```

## 📚 Boas Práticas

1. **Separação de Responsabilidades**: Controllers apenas recebem requisições, Services contêm lógica de negócio
2. **Tratamento de Erros**: Use os middlewares de erro já configurados
3. **Validação**: Valide dados de entrada antes de processar
4. **Tipagem**: Use TypeScript para garantir tipagem forte
5. **Migrations**: Sempre use migrações para alterar o schema do banco

## 📄 Licença

MIT

