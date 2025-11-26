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
      if (publicado !== undefined) where.publicado = publicado === 'true';

      // Buscar todas as notícias que atendem ao filtro de publicado
      let noticias = await em.find(
        Noticia,
        where,
        {
          orderBy: { data_publicacao: 'DESC', createdAt: 'DESC' },
          limit,
        }
      );

      // Filtrar por categoria de forma case-insensitive se necessário
      if (categoria) {
        const categoriaLower = (categoria as string).toLowerCase().trim();
        noticias = noticias.filter(n => 
          n.categoria && n.categoria.toLowerCase().trim() === categoriaLower
        );
      }

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

      const { titulo, conteudo, resumo, imagem_url, categoria, tags, publicado, destaque } = req.body;

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
        publicado: publicado !== undefined ? publicado : true,
        destaque: destaque || false,
        data_publicacao: new Date(),
        visualizacoes: 0,
      } as any);

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

  /**
   * Atualiza uma notícia existente
   */
  async update(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const { titulo, conteudo, resumo, imagem_url, categoria, tags, publicado, destaque } = req.body;

      const noticia = await em.findOne(Noticia, { id });
      if (!noticia) {
        return res.status(404).json({
          success: false,
          message: 'Notícia não encontrada',
        });
      }

      if (titulo !== undefined) noticia.titulo = titulo;
      if (conteudo !== undefined) noticia.conteudo = conteudo;
      if (resumo !== undefined) noticia.resumo = resumo;
      if (imagem_url !== undefined) noticia.imagem_url = imagem_url;
      if (categoria !== undefined) noticia.categoria = categoria;
      if (tags !== undefined) noticia.tags = tags;
      if (publicado !== undefined) {
        noticia.publicado = publicado;
        if (publicado && !noticia.data_publicacao) {
          noticia.data_publicacao = new Date();
        }
      }
      if (destaque !== undefined) noticia.destaque = destaque;

      await em.flush();

      return res.status(200).json({
        success: true,
        data: noticia,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar notícia',
      });
    }
  }

  /**
   * Deleta uma notícia
   */
  async delete(req: Request, res: Response) {
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

      await em.removeAndFlush(noticia);

      return res.status(200).json({
        success: true,
        message: 'Notícia excluída com sucesso',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao excluir notícia',
      });
    }
  }
}

