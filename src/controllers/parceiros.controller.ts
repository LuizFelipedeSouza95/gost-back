import { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Parceiro } from '../server/entities/parceiro.entity.js';

export class ParceirosController {
  /**
   * Lista todos os parceiros
   */
  async list(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      // Se for admin autenticado, retorna todos (incluindo inativos)
      // Senão, retorna apenas os ativos
      let isAdmin = false;
      try {
        if (req.session && req.session.user && req.session.user.roles) {
          const roles = req.session.user.roles;
          isAdmin = Array.isArray(roles) && roles.includes('admin');
        }
      } catch (error) {
        // Se houver qualquer erro ao verificar sessão, assume que não é admin
        isAdmin = false;
      }
      
      const where = isAdmin ? {} : { ativo: true };

      const parceiros = await em.find(
        Parceiro,
        where,
        { orderBy: { ordem_exibicao: 'ASC', nome: 'ASC' } }
      );

      return res.status(200).json({
        success: true,
        data: parceiros,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar parceiros',
      });
    }
  }

  /**
   * Cria um novo parceiro
   */
  async create(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const {
        nome,
        descricao,
        logo_url,
        website,
        email,
        telefone,
        endereco,
        tipo,
        ordem_exibicao,
      } = req.body;

      if (!nome) {
        return res.status(400).json({
          success: false,
          message: 'Nome do parceiro é obrigatório',
        });
      }

      const parceiro = em.create(Parceiro, {
        nome,
        descricao,
        logo_url,
        website,
        email,
        telefone,
        endereco,
        tipo,
        ordem_exibicao: ordem_exibicao || 0,
        ativo: true,
      } as any);

      await em.persistAndFlush(parceiro);

      return res.status(201).json({
        success: true,
        data: parceiro,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar parceiro',
      });
    }
  }

  /**
   * Atualiza um parceiro existente
   */
  async update(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const {
        nome,
        descricao,
        logo_url,
        website,
        email,
        telefone,
        endereco,
        tipo,
        ordem_exibicao,
        ativo,
      } = req.body;

      const parceiro = await em.findOne(Parceiro, { id });
      if (!parceiro) {
        return res.status(404).json({
          success: false,
          message: 'Parceiro não encontrado',
        });
      }

      if (nome !== undefined) parceiro.nome = nome;
      if (descricao !== undefined) parceiro.descricao = descricao;
      if (logo_url !== undefined) parceiro.logo_url = logo_url;
      if (website !== undefined) parceiro.website = website;
      if (email !== undefined) parceiro.email = email;
      if (telefone !== undefined) parceiro.telefone = telefone;
      if (endereco !== undefined) parceiro.endereco = endereco;
      if (tipo !== undefined) parceiro.tipo = tipo;
      if (ordem_exibicao !== undefined) parceiro.ordem_exibicao = ordem_exibicao;
      if (ativo !== undefined) parceiro.ativo = ativo;

      await em.persistAndFlush(parceiro);

      return res.status(200).json({
        success: true,
        data: parceiro,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar parceiro',
      });
    }
  }

  /**
   * Exclui um parceiro
   */
  async delete(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const parceiro = await em.findOne(Parceiro, { id });

      if (!parceiro) {
        return res.status(404).json({
          success: false,
          message: 'Parceiro não encontrado',
        });
      }

      await em.removeAndFlush(parceiro);

      return res.status(200).json({
        success: true,
        message: 'Parceiro excluído com sucesso',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao excluir parceiro',
      });
    }
  }
}

