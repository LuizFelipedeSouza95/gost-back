import { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { FAQ } from '../server/entities/faq.entity.js';

export class FAQsController {
  /**
   * Lista todas as FAQs
   */
  async list(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { categoria } = req.query;

      const where: any = { ativo: true };
      if (categoria) where.categoria = categoria;

      const faqs = await em.find(
        FAQ,
        where,
        { orderBy: { ordem_exibicao: 'ASC', pergunta: 'ASC' } }
      );

      return res.status(200).json({
        success: true,
        data: faqs,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar FAQs',
      });
    }
  }

  /**
   * Cria uma nova FAQ
   */
  async create(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { pergunta, resposta, categoria, ordem_exibicao } = req.body;

      if (!pergunta || !resposta) {
        return res.status(400).json({
          success: false,
          message: 'Pergunta e resposta são obrigatórias',
        });
      }

      const faq = em.create(FAQ, {
        pergunta,
        resposta,
        categoria,
        ordem_exibicao: ordem_exibicao || 0,
        ativo: true,
        visualizacoes: 0,
      } as any);

      await em.persistAndFlush(faq);

      return res.status(201).json({
        success: true,
        data: faq,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar FAQ',
      });
    }
  }
}

