import { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Estatuto } from '../server/entities/estatuto.entity.js';

export class EstatutoController {
  /**
   * Obtém o estatuto (deve haver apenas um)
   */
  async get(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const estatutos = await em.find(Estatuto, {}, { orderBy: { createdAt: 'DESC' }, limit: 1 });
      const estatuto = estatutos.length > 0 ? estatutos[0] : null;

      if (!estatuto) {
        // Retorna valores padrão se não existir
        return res.status(200).json({
          success: true,
          data: {
            titulo: 'Estatuto de Conduta e Operação do GOST',
            descricao: 'Diretrizes oficiais e regulamentações da equipe',
            conteudo: {
              topics: []
            }
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: estatuto,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter estatuto',
      });
    }
  }

  /**
   * Cria ou atualiza o estatuto
   */
  async createOrUpdate(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { titulo, descricao, conteudo } = req.body;

      if (!titulo || !conteudo) {
        return res.status(400).json({
          success: false,
          message: 'Título e conteúdo são obrigatórios',
        });
      }

      // Verifica se já existe um estatuto
      const estatutos = await em.find(Estatuto, {}, { orderBy: { createdAt: 'DESC' }, limit: 1 });
      let estatuto = estatutos.length > 0 ? estatutos[0] : null;

      if (estatuto) {
        // Atualiza
        estatuto.titulo = titulo;
        estatuto.descricao = descricao !== undefined ? descricao : estatuto.descricao;
        estatuto.conteudo = conteudo;

        await em.persistAndFlush(estatuto);
      } else {
        // Cria novo
        estatuto = em.create(Estatuto, {
          titulo,
          descricao: descricao || null,
          conteudo,
        } as any);

        await em.persistAndFlush(estatuto);
      }

      return res.status(200).json({
        success: true,
        data: estatuto,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao salvar estatuto',
      });
    }
  }
}

