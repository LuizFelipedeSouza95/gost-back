import { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Usuario } from '../server/entities/usuarios.entity.js';
import { Squad } from '../server/entities/squad.entity.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export class UsuariosController {
  /**
   * Lista todos os usuários (com paginação)
   */
  async list(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const [usuarios, total] = await em.findAndCount(
        Usuario,
        { active: true },
        {
          limit,
          offset,
          orderBy: { createdAt: 'DESC' },
          populate: ['squad'],
        }
      );

      return res.status(200).json({
        success: true,
        data: usuarios,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar usuários',
      });
    }
  }

  /**
   * Obtém um usuário por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const usuario = await em.findOne(Usuario, { id, active: true }, { populate: ['squad'] });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        data: usuario,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter usuário',
      });
    }
  }

  /**
   * Atualiza um usuário
   */
  async update(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const usuario = await em.findOne(Usuario, { id });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      // Verifica se o usuário tem permissão (admin ou o próprio usuário)
      const sessionUser = req.session?.user;
      if (!sessionUser || (sessionUser.id !== id && !sessionUser.roles.includes('admin'))) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para atualizar este usuário',
        });
      }

      const allowedFields = [
        'name',
        'nome_guerra',
        'patent',
        'classe',
        'data_admissao_gost',
        'comando_geral',
        'comando_squad',
        'is_comandante_squad',
        'nome_squad_subordinado',
        'id_squad_subordinado',
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          (usuario as any)[field] = req.body[field];
        }
      });

      await em.flush();

      return res.status(200).json({
        success: true,
        data: usuario,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar usuário',
      });
    }
  }

  /**
   * Deleta um usuário
   */
  async delete(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }
      const { id } = req.params;
      const usuario = await em.findOne(Usuario, { id });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      usuario.active = false;
      await em.flush();

      return res.status(200).json({
        success: true,
        message: 'Usuário deletado com sucesso',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao deletar usuário',
      });
    }
  }

  /**
   * Cria um usuário manualmente
   * Apenas nome e email são obrigatórios
   */
  async create(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { name, email, nome_guerra, patent, roles, active, squad_id, picture } = req.body;

      // Validação: nome e email são obrigatórios
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Nome é obrigatório',
        });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório',
        });
      }

      // Valida formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email inválido',
        });
      }

      // Verifica se o email já existe
      const existingUser = await em.findOne(Usuario, { email: email.trim().toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email já está em uso',
        });
      }

      // Busca o squad se fornecido
      let squad = null;
      if (squad_id) {
        squad = await em.findOne(Squad, { id: squad_id });
        if (!squad) {
          return res.status(400).json({
            success: false,
            message: 'Squad não encontrado',
          });
        }
      }

      // Cria o usuário com valores padrão
      const usuario = em.create(Usuario, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        nome_guerra: nome_guerra?.trim() || null,
        patent: (patent || 'recruta') as 'comando' | 'comando_squad' | 'soldado' | 'sub_comando' | 'recruta',
        roles: roles || ['user'],
        active: active !== undefined ? active : true,
        squad: squad || null,
        picture: picture || null,
        googleId: null, // Usuário criado manualmente não tem Google ID
        password: null,
        comando_geral: [],
        comando_squad: null,
        classe: '',
        data_admissao_gost: '',
        is_comandante_squad: false,
        nome_squad_subordinado: null,
        id_squad_subordinado: null,
      } as any);

      await em.persistAndFlush(usuario);

      // Recarrega o usuário com relacionamentos
      await em.refresh(usuario, { populate: ['squad'] });

      return res.status(201).json({
        success: true,
        data: usuario,
        message: 'Usuário criado com sucesso',
      });
    } catch (error: any) {
      // Trata erro de email duplicado
      if (error.code === '23505' || error.message?.includes('unique')) {
        return res.status(400).json({
          success: false,
          message: 'Email já está em uso',
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar usuário',
      });
    }
  }
}