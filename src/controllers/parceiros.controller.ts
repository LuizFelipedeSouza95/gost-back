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

      const parceiros = await em.find(
        Parceiro,
        { ativo: true },
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
      });

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
}

