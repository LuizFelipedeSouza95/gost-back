# Exemplo de Uso - Criando uma Rota Completa

Este documento mostra como criar uma rota completa seguindo a estrutura do projeto.

## Exemplo: Rota de Usuários

### 1. Criar o Controller

```typescript
// src/controllers/usuario.controller.ts
import { Request, Response } from 'express';
import { BaseController } from './base.controller.js';
import { UsuarioService } from '../services/usuario.service.js';
import { EntityManager } from '@mikro-orm/core';

export class UsuarioController extends BaseController {
  private usuarioService: UsuarioService;

  constructor(em: EntityManager) {
    super();
    this.usuarioService = new UsuarioService(em);
  }

  async index(req: Request, res: Response): Promise<Response> {
    try {
      const usuarios = await this.usuarioService.findAll();
      return this.success(res, { usuarios });
    } catch (error: any) {
      return this.error(res, error.message, 500);
    }
  }

  async show(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const usuario = await this.usuarioService.findById(id);
      
      if (!usuario) {
        return this.error(res, 'Usuário não encontrado', 404);
      }

      return this.success(res, { usuario });
    } catch (error: any) {
      return this.error(res, error.message, 500);
    }
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = await this.usuarioService.create(req.body);
      return this.success(res, { usuario }, 201);
    } catch (error: any) {
      return this.error(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const usuario = await this.usuarioService.update(id, req.body);
      return this.success(res, { usuario });
    } catch (error: any) {
      return this.error(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await this.usuarioService.delete(id);
      return this.success(res, { message: 'Usuário deletado com sucesso' });
    } catch (error: any) {
      return this.error(res, error.message, 400);
    }
  }
}
```

### 2. Criar o Service

```typescript
// src/services/usuario.service.ts
import { EntityManager } from '@mikro-orm/core';
import { BaseService } from './base.service.js';
import { Usuario } from '../../server/entities/usuarios.entity.js';

export class UsuarioService extends BaseService<Usuario> {
  constructor(em: EntityManager) {
    super(em, Usuario);
  }

  // Métodos customizados podem ser adicionados aqui
  async findByEmail(email: string): Promise<Usuario | null> {
    return this.repository.findOne({ email } as any);
  }
}
```

### 3. Criar as Rotas

```typescript
// src/routes/usuario.routes.ts
import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller.js';
import { RequestContext } from '@mikro-orm/core';

const router = Router();

// Middleware para obter o EntityManager do RequestContext
const getController = (req: any) => {
  const em = RequestContext.getEntityManager()!;
  return new UsuarioController(em);
};

router.get('/', async (req, res) => {
  const controller = getController(req);
  await controller.index(req, res);
});

router.get('/:id', async (req, res) => {
  const controller = getController(req);
  await controller.show(req, res);
});

router.post('/', async (req, res) => {
  const controller = getController(req);
  await controller.create(req, res);
});

router.put('/:id', async (req, res) => {
  const controller = getController(req);
  await controller.update(req, res);
});

router.delete('/:id', async (req, res) => {
  const controller = getController(req);
  await controller.delete(req, res);
});

export default router;
```

### 4. Registrar as Rotas no index.ts

```typescript
// src/routes/index.ts
import { Router } from 'express';
import usuarioRoutes from './usuario.routes.js';

const router = Router();

router.use('/usuarios', usuarioRoutes);

export default router;
```

## Estrutura Final

Após seguir esses passos, você terá:

- ✅ Controller com métodos CRUD
- ✅ Service com lógica de negócio
- ✅ Rotas configuradas
- ✅ Integração com MikroORM
- ✅ Tratamento de erros
- ✅ Respostas padronizadas

## Testando

```bash
# Listar usuários
GET http://localhost:3000/api/usuarios

# Buscar usuário por ID
GET http://localhost:3000/api/usuarios/:id

# Criar usuário
POST http://localhost:3000/api/usuarios
Content-Type: application/json

{
  "nome": "João",
  "email": "joao@example.com"
}

# Atualizar usuário
PUT http://localhost:3000/api/usuarios/:id
Content-Type: application/json

{
  "nome": "João Silva"
}

# Deletar usuário
DELETE http://localhost:3000/api/usuarios/:id
```

