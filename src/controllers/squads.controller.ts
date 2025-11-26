import { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Squad } from '../server/entities/squad.entity.js';
import { Usuario } from '../server/entities/usuarios.entity.js';

export class SquadsController {
  /**
   * Lista todos os squads
   */
  async list(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const squads = await em.find(Squad, { ativo: true }, { populate: ['membros', 'comandante'], orderBy: { nome: 'ASC' } });

      return res.status(200).json({
        success: true,
        data: squads,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar squads',
      });
    }
  }

  /**
   * Obtém um squad por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const squad = await em.findOne(Squad, { id, ativo: true }, { populate: ['membros', 'comandante'] });

      if (!squad) {
        return res.status(404).json({
          success: false,
          message: 'Squad não encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        data: squad,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter squad',
      });
    }
  }

  /**
   * Cria um novo squad
   */
  async create(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { nome, descricao, comando_squad, comando_geral, cor, logo_url, comandante_id, membros_ids } = req.body;

      if (!nome) {
        return res.status(400).json({
          success: false,
          message: 'Nome do squad é obrigatório',
        });
      }

      // Busca o comandante se fornecido
      let comandante: Usuario | null = null;
      if (comandante_id) {
        comandante = await em.findOne(Usuario, { id: comandante_id });
        if (!comandante) {
          return res.status(400).json({
            success: false,
            message: 'Comandante não encontrado',
          });
        }
      }

      const squad = em.create(Squad, {
        nome,
        descricao,
        comando_squad,
        comando_geral: comando_geral || [],
        cor,
        logo_url,
        comandante,
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await em.persistAndFlush(squad);

      // Atualiza os membros do squad se fornecido
      if (membros_ids && Array.isArray(membros_ids) && membros_ids.length > 0) {
        const membros = await em.find(Usuario, { id: { $in: membros_ids } as any });
        for (const membro of membros) {
          membro.squad = squad;
        }
        await em.flush();
      }

      // Recarrega o squad com relacionamentos
      await em.refresh(squad, { populate: ['membros', 'comandante'] });

      return res.status(201).json({
        success: true,
        data: squad,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar squad',
      });
    }
  }

  /**
   * Atualiza um squad
   */
  async update(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const squad = await em.findOne(Squad, { id }, { populate: ['membros', 'comandante'] });

      if (!squad) {
        return res.status(404).json({
          success: false,
          message: 'Squad não encontrado',
        });
      }

      const { nome, descricao, comando_squad, comando_geral, cor, logo_url, ativo, comandante_id, membros_ids } = req.body;

      if (nome !== undefined) squad.nome = nome;
      if (descricao !== undefined) squad.descricao = descricao;
      if (comando_squad !== undefined) squad.comando_squad = comando_squad;
      if (comando_geral !== undefined) squad.comando_geral = comando_geral;
      if (cor !== undefined) squad.cor = cor;
      if (logo_url !== undefined) squad.logo_url = logo_url;
      if (ativo !== undefined) squad.ativo = ativo;

      // Atualiza o comandante se fornecido
      if (comandante_id !== undefined) {
        if (comandante_id === null) {
          squad.comandante = null;
        } else {
          const comandante = await em.findOne(Usuario, { id: comandante_id });
          if (!comandante) {
            return res.status(400).json({
              success: false,
              message: 'Comandante não encontrado',
            });
          }
          squad.comandante = comandante;
        }
      }

      // Atualiza os membros do squad se fornecido
      if (membros_ids !== undefined && Array.isArray(membros_ids)) {
        // Remove todos os membros atuais deste squad
        const membrosAtuais = await em.find(Usuario, { squad: squad });
        for (const membro of membrosAtuais) {
          membro.squad = null;
        }

        // Adiciona os novos membros
        if (membros_ids.length > 0) {
          const novosMembros = await em.find(Usuario, { id: { $in: membros_ids } as any });
          for (const membro of novosMembros) {
            membro.squad = squad;
          }
        }
      }

      await em.flush();

      // Recarrega o squad com relacionamentos
      await em.refresh(squad, { populate: ['membros', 'comandante'] });

      return res.status(200).json({
        success: true,
        data: squad,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar squad',
      });
    }
  }

  /**
   * Deleta um squad (soft delete)
   */
  async delete(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const squad = await em.findOne(Squad, { id });

      if (!squad) {
        return res.status(404).json({
          success: false,
          message: 'Squad não encontrado',
        });
      }

      squad.ativo = false;
      await em.flush();

      return res.status(200).json({
        success: true,
        message: 'Squad deletado com sucesso',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao deletar squad',
      });
    }
  }
}

