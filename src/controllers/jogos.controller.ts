import { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Jogo } from '../server/entities/jogo.entity.js';

export class JogosController {
  /**
   * Lista todos os jogos
   */
  async list(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { status, limit: limitParam } = req.query;
      const limit = limitParam ? parseInt(limitParam as string) : undefined;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const jogos = await em.find(
        Jogo,
        where,
        {
          orderBy: { data_jogo: 'DESC' },
          limit,
        }
      );

      // Atualizar automaticamente jogos que passaram da data para "completed"
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas a data
      
      const jogosParaAtualizar: Jogo[] = [];
      
      for (const jogo of jogos) {
        // Só atualiza se não estiver cancelado e a data já passou
        if (jogo.status !== 'cancelled' && jogo.status !== 'completed' && jogo.data_jogo) {
          const dataJogo = new Date(jogo.data_jogo);
          dataJogo.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas a data
          
          // Se a data do jogo já passou, atualiza para completed
          if (dataJogo < hoje) {
            jogo.status = 'completed';
            jogosParaAtualizar.push(jogo);
          }
        }
      }
      
      // Salva todas as atualizações de uma vez
      if (jogosParaAtualizar.length > 0) {
        await em.persistAndFlush(jogosParaAtualizar);
      }

      return res.status(200).json({
        success: true,
        data: jogos,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar jogos',
      });
    }
  }

  /**
   * Obtém um jogo por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const jogo = await em.findOne(Jogo, { id });

      if (!jogo) {
        return res.status(404).json({
          success: false,
          message: 'Jogo não encontrado',
        });
      }

      // Atualizar automaticamente se a data passou e não estiver cancelado
      if (jogo.status !== 'cancelled' && jogo.status !== 'completed' && jogo.data_jogo) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataJogo = new Date(jogo.data_jogo);
        dataJogo.setHours(0, 0, 0, 0);
        
        if (dataJogo < hoje) {
          jogo.status = 'completed';
          await em.persistAndFlush(jogo);
        }
      }

      return res.status(200).json({
        success: true,
        data: jogo,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter jogo',
      });
    }
  }

  /**
   * Cria um novo jogo
   */
  async create(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const {
        nome_jogo,
        descricao_jogo,
        data_jogo,
        local_jogo,
        hora_inicio,
        hora_fim,
        localizacao,
        capa_url,
        tipo_jogo,
        max_participantes,
      } = req.body;

      if (!nome_jogo) {
        return res.status(400).json({
          success: false,
          message: 'Nome do jogo é obrigatório',
        });
      }

      const sessionUser = req.session?.user;
      const jogo = em.create(Jogo, {
        nome_jogo,
        descricao_jogo,
        data_jogo: data_jogo ? new Date(data_jogo) : null,
        local_jogo,
        hora_inicio,
        hora_fim,
        localizacao,
        capa_url,
        tipo_jogo,
        max_participantes,
        status: 'scheduled',
        confirmations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await em.persistAndFlush(jogo);

      return res.status(201).json({
        success: true,
        data: jogo,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar jogo',
      });
    }
  }

  /**
   * Confirma presença em um jogo
   */
  async confirmPresence(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const jogo = await em.findOne(Jogo, { id });

      if (!jogo) {
        return res.status(404).json({
          success: false,
          message: 'Jogo não encontrado',
        });
      }

      const sessionUser = req.session?.user;
      if (!sessionUser) {
        return res.status(401).json({
          success: false,
          message: 'Não autenticado',
        });
      }

      if (!jogo.confirmations.includes(sessionUser.id)) {
        jogo.confirmations.push(sessionUser.id);
        await em.flush();
      }

      return res.status(200).json({
        success: true,
        data: jogo,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao confirmar presença',
      });
    }
  }

  /**
   * Remove confirmação de presença
   */
  async removePresence(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const jogo = await em.findOne(Jogo, { id });

      if (!jogo) {
        return res.status(404).json({
          success: false,
          message: 'Jogo não encontrado',
        });
      }

      const sessionUser = req.session?.user;
      if (!sessionUser) {
        return res.status(401).json({
          success: false,
          message: 'Não autenticado',
        });
      }

      jogo.confirmations = jogo.confirmations.filter((userId) => userId !== sessionUser.id);
      await em.flush();

      return res.status(200).json({
        success: true,
        data: jogo,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao remover confirmação',
      });
    }
  }

  /**
   * Atualiza um jogo
   */
  async update(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const jogo = await em.findOne(Jogo, { id });

      if (!jogo) {
        return res.status(404).json({
          success: false,
          message: 'Jogo não encontrado',
        });
      }

      const {
        nome_jogo,
        descricao_jogo,
        data_jogo,
        local_jogo,
        hora_inicio,
        hora_fim,
        localizacao,
        capa_url,
        tipo_jogo,
        max_participantes,
        status,
      } = req.body;

      if (nome_jogo !== undefined) jogo.nome_jogo = nome_jogo;
      if (descricao_jogo !== undefined) jogo.descricao_jogo = descricao_jogo;
      if (data_jogo !== undefined) jogo.data_jogo = data_jogo ? new Date(data_jogo) : null;
      if (local_jogo !== undefined) jogo.local_jogo = local_jogo;
      if (hora_inicio !== undefined) jogo.hora_inicio = hora_inicio;
      if (hora_fim !== undefined) jogo.hora_fim = hora_fim;
      if (localizacao !== undefined) jogo.localizacao = localizacao;
      if (capa_url !== undefined) jogo.capa_url = capa_url;
      if (tipo_jogo !== undefined) jogo.tipo_jogo = tipo_jogo;
      if (max_participantes !== undefined) jogo.max_participantes = max_participantes;
      if (status !== undefined) jogo.status = status;

      await em.persistAndFlush(jogo);

      return res.status(200).json({
        success: true,
        data: jogo,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar jogo',
      });
    }
  }

  /**
   * Deleta um jogo
   */
  async delete(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const jogo = await em.findOne(Jogo, { id });

      if (!jogo) {
        return res.status(404).json({
          success: false,
          message: 'Jogo não encontrado',
        });
      }

      await em.removeAndFlush(jogo);

      return res.status(200).json({
        success: true,
        message: 'Jogo deletado com sucesso',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao deletar jogo',
      });
    }
  }
}

