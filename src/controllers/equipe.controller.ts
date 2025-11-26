import { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Equipe } from '../server/entities/equipe.entity.js';

export class EquipeController {
  /**
   * Obtém informações da equipe (deve haver apenas uma)
   */
  async get(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const equipes = await em.find(Equipe, {}, { orderBy: { createdAt: 'DESC' }, limit: 1 });
      const equipe = equipes.length > 0 ? equipes[0] : null;

      if (!equipe) {
        // Retorna valores padrão se não existir
        return res.status(200).json({
          success: true,
          data: {
            nome: 'GOST',
            objetivo: 'Operações Especiais de Airsoft',
            data_criacao: new Date('2020-01-01').toISOString(),
            descricao: 'Ghost Operations Special Team'
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: equipe,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter informações da equipe',
      });
    }
  }

  /**
   * Cria ou atualiza informações da equipe
   */
  async createOrUpdate(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { nome, significado_nome, objetivo, data_criacao, descricao, logo_url, email, telefone, endereco, cidade, estado, instagram_url, whatsapp_url } = req.body;

      // Verifica se já existe uma equipe
      const equipes = await em.find(Equipe, {}, { orderBy: { createdAt: 'DESC' }, limit: 1 });
      let equipe = equipes.length > 0 ? equipes[0] : null;

      if (equipe) {
        // Atualiza
        equipe.nome = nome || equipe.nome;
        equipe.significado_nome = significado_nome !== undefined ? significado_nome : equipe.significado_nome;
        equipe.objetivo = objetivo !== undefined ? objetivo : equipe.objetivo;
        equipe.data_criacao = data_criacao ? new Date(data_criacao) : equipe.data_criacao;
        equipe.descricao = descricao !== undefined ? descricao : equipe.descricao;
        equipe.logo_url = logo_url !== undefined ? logo_url : equipe.logo_url;
        equipe.email = email !== undefined ? email : equipe.email;
        equipe.telefone = telefone !== undefined ? telefone : equipe.telefone;
        equipe.endereco = endereco !== undefined ? endereco : equipe.endereco;
        equipe.cidade = cidade !== undefined ? cidade : equipe.cidade;
        equipe.estado = estado !== undefined ? estado : equipe.estado;
        equipe.instagram_url = instagram_url !== undefined ? instagram_url : equipe.instagram_url;
        equipe.whatsapp_url = whatsapp_url !== undefined ? whatsapp_url : equipe.whatsapp_url;

        await em.persistAndFlush(equipe);
      } else {
        // Cria nova
        equipe = em.create(Equipe, {
          nome: nome || 'GOST',
          significado_nome: significado_nome || null,
          objetivo: objetivo || 'Operações Especiais de Airsoft',
          data_criacao: data_criacao ? new Date(data_criacao) : new Date('2020-01-01'),
          descricao: descricao || 'Ghost Operations Special Team',
          logo_url,
          email,
          telefone,
          endereco,
          cidade,
          estado,
          instagram_url,
          whatsapp_url,
        } as any);

        await em.persistAndFlush(equipe);
      }

      return res.status(200).json({
        success: true,
        data: equipe,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao salvar informações da equipe',
      });
    }
  }
}

