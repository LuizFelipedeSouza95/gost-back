import { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Noticia } from '../server/entities/noticia.entity.js';

export class NoticiasController {
  /**
   * Lista todas as notícias
   */
  async list(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { categoria, publicado, limit: limitParam } = req.query;
      const limit = limitParam ? parseInt(limitParam as string) : undefined;

      const where: any = {};
      if (categoria) where.categoria = categoria;
      if (publicado !== undefined) where.publicado = publicado === 'true';

      const noticias = await em.find(
        Noticia,
        where,
        {
          orderBy: { data_publicacao: 'DESC', createdAt: 'DESC' },
          limit,
        }
      );

      return res.status(200).json({
        success: true,
        data: noticias,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar notícias',
      });
    }
  }

  /**
   * Obtém uma notícia por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const noticia = await em.findOne(Noticia, { id });

      if (!noticia) {
        return res.status(404).json({
          success: false,
          message: 'Notícia não encontrada',
        });
      }

      // Incrementa visualizações
      noticia.visualizacoes += 1;
      await em.flush();

      return res.status(200).json({
        success: true,
        data: noticia,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter notícia',
      });
    }
  }

  /**
   * Cria uma nova notícia
   */
  async create(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { titulo, conteudo, resumo, imagem_url, categoria, tags } = req.body;

      if (!titulo || !conteudo) {
        return res.status(400).json({
          success: false,
          message: 'Título e conteúdo são obrigatórios',
        });
      }

      const sessionUser = req.session?.user;
      const noticia = em.create(Noticia, {
        titulo,
        conteudo,
        resumo,
        imagem_url,
        autor_id: sessionUser?.id || null,
        autor_nome: sessionUser?.name || null,
        categoria,
        tags: tags || [],
        publicado: true,
        data_publicacao: new Date(),
        visualizacoes: 0,
      });

      await em.persistAndFlush(noticia);

      return res.status(201).json({
        success: true,
        data: noticia,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar notícia',
      });
    }
  }
}

