import { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Agenda } from '../server/entities/agenda.entity.js';

export class AgendaController {
  /**
   * Lista todos os itens da agenda (público)
   */
  async list(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const agendaItems = await em.find(
        Agenda,
        { ativo: true },
        {
          orderBy: [
            { data: 'ASC' },
            { ordem: 'ASC' },
            { hora: 'ASC' },
            { createdAt: 'ASC' },
          ],
        }
      );

      return res.status(200).json({
        success: true,
        data: agendaItems,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar agenda',
      });
    }
  }

  /**
   * Lista todos os itens da agenda (incluindo inativos - admin)
   */
  async listAll(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const agendaItems = await em.find(
        Agenda,
        {},
        {
          orderBy: [
            { data: 'ASC' },
            { ordem: 'ASC' },
            { hora: 'ASC' },
            { createdAt: 'ASC' },
          ],
        }
      );

      return res.status(200).json({
        success: true,
        data: agendaItems,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar agenda',
      });
    }
  }

  /**
   * Obtém um item da agenda por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const agendaItem = await em.findOne(Agenda, { id });

      if (!agendaItem) {
        return res.status(404).json({
          success: false,
          message: 'Item da agenda não encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        data: agendaItem,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter item da agenda',
      });
    }
  }

  /**
   * Cria um novo item na agenda (admin)
   */
  async create(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { titulo, descricao, data, hora, local, tipo, ordem } = req.body;

      if (!titulo || !data) {
        return res.status(400).json({
          success: false,
          message: 'Título e data são obrigatórios',
        });
      }

      const agendaItem = em.create(Agenda, {
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        data: new Date(data),
        hora: hora?.trim() || null,
        local: local?.trim() || null,
        tipo: tipo?.trim() || null,
        ordem: ordem ? parseInt(ordem) : null,
        ativo: true,
      } as any);

      await em.persistAndFlush(agendaItem);

      return res.status(201).json({
        success: true,
        data: agendaItem,
        message: 'Item da agenda criado com sucesso',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar item da agenda',
      });
    }
  }

  /**
   * Atualiza um item da agenda (admin)
   */
  async update(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const agendaItem = await em.findOne(Agenda, { id });

      if (!agendaItem) {
        return res.status(404).json({
          success: false,
          message: 'Item da agenda não encontrado',
        });
      }

      const { titulo, descricao, data, hora, local, tipo, ordem, ativo } = req.body;

      if (titulo !== undefined) agendaItem.titulo = titulo.trim();
      if (descricao !== undefined) agendaItem.descricao = descricao?.trim() || null;
      if (data !== undefined) agendaItem.data = new Date(data);
      if (hora !== undefined) agendaItem.hora = hora?.trim() || null;
      if (local !== undefined) agendaItem.local = local?.trim() || null;
      if (tipo !== undefined) agendaItem.tipo = tipo?.trim() || null;
      if (ordem !== undefined) agendaItem.ordem = ordem ? parseInt(ordem) : null;
      if (ativo !== undefined) agendaItem.ativo = ativo;

      await em.persistAndFlush(agendaItem);

      return res.status(200).json({
        success: true,
        data: agendaItem,
        message: 'Item da agenda atualizado com sucesso',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar item da agenda',
      });
    }
  }

  /**
   * Deleta um item da agenda (admin)
   */
  async delete(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const agendaItem = await em.findOne(Agenda, { id });

      if (!agendaItem) {
        return res.status(404).json({
          success: false,
          message: 'Item da agenda não encontrado',
        });
      }

      await em.removeAndFlush(agendaItem);

      return res.status(200).json({
        success: true,
        message: 'Item da agenda excluído com sucesso',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao excluir item da agenda',
      });
    }
  }
}

