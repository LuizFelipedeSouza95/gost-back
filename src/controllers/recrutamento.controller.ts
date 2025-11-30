import { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Recrutamento } from '../server/entities/recrutamento.entity.js';
import { Usuario } from '../server/entities/usuarios.entity.js';
import { EmailService } from '../services/email.service.js';

export class RecrutamentoController {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Lista todos os recrutamentos (admin apenas)
   */
  async list(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { status, etapa } = req.query;

      const where: any = {};
      if (status) where.status = status;
      if (etapa) {
        // Filtra por etapa específica
        const etapaField = `etapa_${etapa}`;
        where[etapaField] = req.query.etapa_status || 'pendente';
      }

      const recrutamentos = await em.find(
        Recrutamento,
        where,
        {
          orderBy: { createdAt: 'DESC' },
          populate: ['responsavel'],
        }
      );

      return res.status(200).json({
        success: true,
        data: recrutamentos,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar recrutamentos',
      });
    }
  }

  /**
   * Obtém o recrutamento do usuário logado
   */
  async getMyRecrutamento(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const sessionUser = req.session?.user;
      if (!sessionUser) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
        });
      }

      // Busca por usuario_id ou email (busca o mais recente)
      // Busca todos os recrutamentos não cancelados do usuário
      const allRecrutamentos = await em.find(
        Recrutamento,
        {
          $or: [
            { usuario_id: sessionUser.id },
            ...(sessionUser.email ? [{ email: sessionUser.email.toLowerCase() }] : []),
          ],
        },
        { 
          populate: ['responsavel'], 
          orderBy: { createdAt: 'DESC' }
        }
      );

      // Filtra apenas os não cancelados e pega o mais recente
      const recrutamento = allRecrutamentos.find(r => r.status !== 'cancelado') || null;

      if (!recrutamento) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum recrutamento encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        data: recrutamento,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter recrutamento',
      });
    }
  }

  /**
   * Obtém um recrutamento por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const recrutamento = await em.findOne(
        Recrutamento,
        { id },
        { populate: ['responsavel'] }
      );

      if (!recrutamento) {
        return res.status(404).json({
          success: false,
          message: 'Recrutamento não encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        data: recrutamento,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter recrutamento',
      });
    }
  }

  /**
   * Cria um novo recrutamento (inscrição)
   */
  async create(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const sessionUser = req.session?.user;
      const {
        nome,
        email,
        telefone,
        idade,
        cidade,
        experiencia,
        equipamento,
        disponibilidade,
        motivacao,
        instagram,
      } = req.body;

      // Validações básicas
      if (!nome || !email) {
        return res.status(400).json({
          success: false,
          message: 'Nome e email são obrigatórios',
        });
      }

      // Verifica se já existe recrutamento ativo com este email
      const existingRecrutamento = await em.findOne(Recrutamento, {
        email: email.toLowerCase(),
        status: 'ativo',
      });

      if (existingRecrutamento) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma inscrição ativa com este email',
        });
      }

      // Cria o recrutamento
      const recrutamento = em.create(Recrutamento, {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        telefone: telefone?.trim() || null,
        idade: idade ? parseInt(idade) : null,
        cidade: cidade?.trim() || null,
        experiencia: experiencia?.trim() || null,
        equipamento: equipamento?.trim() || null,
        disponibilidade: disponibilidade?.trim() || null,
        motivacao: motivacao?.trim() || null,
        instagram: instagram?.trim() || null,
        etapa_inscricao: 'aprovado', // Inscrição é automaticamente aprovada
        data_inscricao: new Date(),
        usuario_id: sessionUser?.id || null,
        status: 'ativo',
      } as any);

      await em.persistAndFlush(recrutamento);

      // Envia email de confirmação
      await this.emailService.sendRecruitmentConfirmation({
        nome: recrutamento.nome,
        email: recrutamento.email,
        telefone: recrutamento.telefone || undefined,
        idade: recrutamento.idade || undefined,
        cidade: recrutamento.cidade || undefined,
        experiencia: recrutamento.experiencia || undefined,
        equipamento: recrutamento.equipamento || undefined,
        disponibilidade: recrutamento.disponibilidade || undefined,
        motivacao: recrutamento.motivacao || undefined,
        instagram: recrutamento.instagram || undefined,
      });

      return res.status(201).json({
        success: true,
        data: recrutamento,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar recrutamento',
      });
    }
  }

  /**
   * Atualiza uma etapa do recrutamento (admin apenas)
   */
  async updateStage(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const { etapa, status, observacoes } = req.body;

      const etapasValidas = ['inscricao', 'avaliacao', 'qa', 'votacao', 'integracao'];
      // Status válidos: pendente, aprovado, reprovado para todas as etapas
      // Para a etapa Q&A, também aceita 'iniciado'
      const statusValidos = etapa === 'qa' 
        ? ['pendente', 'aprovado', 'reprovado', 'iniciado']
        : ['pendente', 'aprovado', 'reprovado'];

      if (!etapasValidas.includes(etapa)) {
        return res.status(400).json({
          success: false,
          message: 'Etapa inválida',
        });
      }

      if (!statusValidos.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido',
        });
      }

      const recrutamento = await em.findOne(Recrutamento, { id });
      if (!recrutamento) {
        return res.status(404).json({
          success: false,
          message: 'Recrutamento não encontrado',
        });
      }

      // Atualiza a etapa
      const etapaField = `etapa_${etapa}` as keyof Recrutamento;
      const observacoesField = `observacoes_${etapa}` as keyof Recrutamento;
      const dataField = `data_${etapa}` as keyof Recrutamento;

      (recrutamento as any)[etapaField] = status;
      (recrutamento as any)[observacoesField] = observacoes || null;
      (recrutamento as any)[dataField] = new Date();

      // Se reprovado, atualiza status geral
      if (status === 'reprovado') {
        recrutamento.status = 'reprovado';
      }

      // Se a etapa de avaliação foi aprovada, atualiza a patente do usuário para "recruta"
      if (etapa === 'avaliacao' && status === 'aprovado' && recrutamento.usuario_id) {
        const usuario = await em.findOne(Usuario, { id: recrutamento.usuario_id });
        if (usuario) {
          // Atualiza a patente para "recruta" se o usuário ainda estiver como "interessado"
          if (usuario.patent === 'interessado' || !usuario.patent) {
            usuario.patent = 'recruta';
            await em.flush();
          }
        }
      }

      // Se todas as etapas foram aprovadas, marca como aprovado
      // Para etapa_qa, considera tanto 'aprovado' quanto 'iniciado' como válido
      if (
        recrutamento.etapa_inscricao === 'aprovado' &&
        recrutamento.etapa_avaliacao === 'aprovado' &&
        (recrutamento.etapa_qa === 'aprovado' || recrutamento.etapa_qa === 'iniciado') &&
        recrutamento.etapa_votacao === 'aprovado' &&
        recrutamento.etapa_integracao === 'aprovado'
      ) {
        recrutamento.status = 'aprovado';
      }

      await em.persistAndFlush(recrutamento);

      // Envia email de atualização
      if (status !== 'pendente') {
        // Mapear 'iniciado' para 'aprovado' no email (ou criar um novo tipo se necessário)
        const emailStatus = status === 'iniciado' ? 'aprovado' : status as 'aprovado' | 'reprovado';
        await this.emailService.sendStageUpdate({
          nome: recrutamento.nome,
          email: recrutamento.email,
          etapa: this.getEtapaNome(etapa),
          status: emailStatus,
          observacoes: observacoes || undefined,
        });
      }

      return res.status(200).json({
        success: true,
        data: recrutamento,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar etapa',
      });
    }
  }

  /**
   * Atribui responsável ao recrutamento (admin apenas)
   */
  async assignResponsible(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const { responsavel_id } = req.body;

      const recrutamento = await em.findOne(Recrutamento, { id });
      if (!recrutamento) {
        return res.status(404).json({
          success: false,
          message: 'Recrutamento não encontrado',
        });
      }

      if (responsavel_id) {
        const responsavel = await em.findOne(Usuario, { id: responsavel_id });
        if (!responsavel) {
          return res.status(404).json({
            success: false,
            message: 'Usuário responsável não encontrado',
          });
        }
        recrutamento.responsavel = responsavel;
      } else {
        recrutamento.responsavel = null;
      }

      await em.persistAndFlush(recrutamento);

      return res.status(200).json({
        success: true,
        data: recrutamento,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atribuir responsável',
      });
    }
  }

  /**
   * Adiciona voto na etapa de votação (comando apenas)
   */
  async addVote(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const { voto } = req.body; // 'aprovado' ou 'reprovado'
      const sessionUser = req.session?.user;

      if (!sessionUser) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
        });
      }

      if (voto !== 'aprovado' && voto !== 'reprovado') {
        return res.status(400).json({
          success: false,
          message: 'Voto inválido. Deve ser "aprovado" ou "reprovado"',
        });
      }

      const recrutamento = await em.findOne(Recrutamento, { id });
      if (!recrutamento) {
        return res.status(404).json({
          success: false,
          message: 'Recrutamento não encontrado',
        });
      }

      // Verifica se está na etapa de votação
      if (recrutamento.etapa_votacao !== 'pendente') {
        return res.status(400).json({
          success: false,
          message: 'Recrutamento não está na etapa de votação',
        });
      }

      // Inicializa votos se não existir
      if (!recrutamento.votos) {
        recrutamento.votos = {};
      }

      // Adiciona ou atualiza voto
      recrutamento.votos[sessionUser.id] = voto;

      // Busca membros da diretoria (comando ou sub_comando) - somente diretoria
      const diretoriaMembers = await em.find(Usuario, {
        $or: [
          { patent: 'comando' },
          { patent: 'sub_comando' },
        ],
        active: true,
      });

      const totalDiretoria = diretoriaMembers.length;
      const votosAprovados = Object.values(recrutamento.votos).filter(v => v === 'aprovado').length;
      const votosReprovados = Object.values(recrutamento.votos).filter(v => v === 'reprovado').length;
      const totalVotos = Object.keys(recrutamento.votos).length;

      // Calcula a maioria necessária (mais da metade)
      // Exemplo: 4 membros -> maioria = 3, 5 membros -> maioria = 3, 6 membros -> maioria = 4
      const maioriaNecessaria = Math.floor(totalDiretoria / 2) + 1;

      // Se a maioria votou aprovado, aprova automaticamente (não precisa esperar todos votarem)
      if (votosAprovados >= maioriaNecessaria) {
        recrutamento.etapa_votacao = 'aprovado';
        recrutamento.data_votacao = new Date();
        recrutamento.observacoes_votacao = `${votosAprovados}/${totalDiretoria} votos aprovados (maioria alcançada)`;
      } 
      // Se a maioria votou reprovado, reprova automaticamente
      else if (votosReprovados >= maioriaNecessaria) {
        recrutamento.etapa_votacao = 'reprovado';
        recrutamento.data_votacao = new Date();
        recrutamento.observacoes_votacao = `${votosReprovados}/${totalDiretoria} votos reprovados (maioria reprovou)`;
        recrutamento.status = 'reprovado';
      }
      // Se todos votaram mas não alcançou maioria em nenhum lado, decide pela maioria simples
      else if (totalVotos >= totalDiretoria) {
        if (votosAprovados > votosReprovados) {
          recrutamento.etapa_votacao = 'aprovado';
          recrutamento.data_votacao = new Date();
          recrutamento.observacoes_votacao = `${votosAprovados}/${totalDiretoria} votos aprovados`;
        } else {
          recrutamento.etapa_votacao = 'reprovado';
          recrutamento.data_votacao = new Date();
          recrutamento.observacoes_votacao = `${votosReprovados}/${totalDiretoria} votos reprovados`;
          recrutamento.status = 'reprovado';
        }
      }

      await em.persistAndFlush(recrutamento);

      return res.status(200).json({
        success: true,
        data: recrutamento,
        votos: {
          total: totalVotos,
          aprovados: votosAprovados,
          reprovados: totalVotos - votosAprovados,
          totalDiretoria,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao adicionar voto',
      });
    }
  }

  /**
   * Deleta um recrutamento (admin apenas)
   */
  async delete(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const recrutamento = await em.findOne(Recrutamento, { id });

      if (!recrutamento) {
        return res.status(404).json({
          success: false,
          message: 'Recrutamento não encontrado',
        });
      }

      await em.removeAndFlush(recrutamento);

      return res.status(200).json({
        success: true,
        message: 'Recrutamento deletado com sucesso',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao deletar recrutamento',
      });
    }
  }

  private getEtapaNome(etapa: string): string {
    const nomes: Record<string, string> = {
      inscricao: 'Inscrição',
      avaliacao: 'Avaliação',
      qa: 'Período Q&A',
      votacao: 'Votação',
      integracao: 'Integração',
    };
    return nomes[etapa] || etapa;
  }
}

