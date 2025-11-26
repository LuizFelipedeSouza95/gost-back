import { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Treinamento } from '../server/entities/treinamento.entity.js';

export class TreinamentosController {
  /**
   * Lista todos os treinamentos
   */
  async list(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { tipo, status, ativo } = req.query;

      const where: any = {};
      if (tipo) where.tipo = tipo;
      if (status) where.status = status;
      if (ativo !== undefined) where.ativo = ativo === 'true';

      const treinamentos = await em.find(
        Treinamento,
        where,
        { orderBy: { data_treinamento: 'DESC' } }
      );

      return res.status(200).json({
        success: true,
        data: treinamentos,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar treinamentos',
      });
    }
  }

  /**
   * Cria um novo treinamento
   */
  async create(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const {
        titulo,
        descricao,
        conteudo,
        data_treinamento,
        local,
        tipo,
        duracao_minutos,
        max_participantes,
        material_necessario,
      } = req.body;

      if (!titulo || !descricao) {
        return res.status(400).json({
          success: false,
          message: 'Título e descrição são obrigatórios',
        });
      }

      const sessionUser = req.session?.user;
      const treinamento = em.create(Treinamento, {
        titulo,
        descricao,
        conteudo,
        data_treinamento: data_treinamento ? new Date(data_treinamento) : null,
        local,
        instrutor_id: sessionUser?.id || null,
        instrutor_nome: sessionUser?.name || null,
        tipo,
        duracao_minutos,
        max_participantes,
        material_necessario,
        participantes: [],
        ativo: true,
        status: 'agendado',
      });

      await em.persistAndFlush(treinamento);

      return res.status(201).json({
        success: true,
        data: treinamento,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar treinamento',
      });
    }
  }

  /**
   * Inscreve um usuário em um treinamento
   */
  async subscribe(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const treinamento = await em.findOne(Treinamento, { id, ativo: true });

      if (!treinamento) {
        return res.status(404).json({
          success: false,
          message: 'Treinamento não encontrado',
        });
      }

      const sessionUser = req.session?.user;
      if (!sessionUser) {
        return res.status(401).json({
          success: false,
          message: 'Não autenticado',
        });
      }

      if (treinamento.max_participantes && treinamento.participantes.length >= treinamento.max_participantes) {
        return res.status(400).json({
          success: false,
          message: 'Treinamento lotado',
        });
      }

      if (!treinamento.participantes.includes(sessionUser.id)) {
        treinamento.participantes.push(sessionUser.id);
        await em.flush();
      }

      return res.status(200).json({
        success: true,
        data: treinamento,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao inscrever no treinamento',
      });
    }
  }
}

