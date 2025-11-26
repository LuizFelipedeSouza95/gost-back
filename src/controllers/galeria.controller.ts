import { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Galeria } from '../server/entities/galeria.entity.js';
import { Jogo } from '../server/entities/jogo.entity.js';
import { AzureBlobService } from '../services/azure-blob.service.js';

export class GaleriaController {
  private azureBlobService: AzureBlobService | null = null;

  constructor() {
    // Inicializa o serviço Azure apenas se a connection string estiver configurada
    try {
      this.azureBlobService = new AzureBlobService();
    } catch (error) {
      console.warn('Azure Blob Service não inicializado. Verifique AZURE_STORAGE_CONNECTION_STRING no .env');
      this.azureBlobService = null;
    }
  }

  /**
   * Lista todas as imagens da galeria
   */
  async list(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { jogo_id, categoria, is_operacao, album, limit: limitParam } = req.query;
      const limit = limitParam ? parseInt(limitParam as string) : undefined;

      const where: any = {};
      if (jogo_id) where.jogo = { id: jogo_id }; // Filtra pelo relacionamento usando o ID
      if (categoria) where.categoria = categoria;
      if (is_operacao !== undefined) where.is_operacao = is_operacao === 'true';
      if (album) where.album = album;

      const imagens = await em.find(
        Galeria,
        where,
        {
          orderBy: { createdAt: 'DESC' },
          limit,
          populate: ['jogo'],
        }
      );

      return res.status(200).json({
        success: true,
        data: imagens,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar galeria',
      });
    }
  }

  /**
   * Cria uma nova imagem na galeria
   * Aceita upload de arquivo via multer ou URL direta
   */
  async create(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const file = req.file;
      const {
        descricao,
        titulo,
        jogo_id,
        is_operacao,
        nome_operacao,
        data_operacao,
        categoria,
        album,
        imagem_url, // Para compatibilidade com upload direto de URL
      } = req.body;

      let imagemUrl: string;
      let thumbnailUrl: string | undefined;

      // Se há arquivo enviado, faz upload para Azure
      if (file && this.azureBlobService) {
        try {
          const uploadResult = await this.azureBlobService.uploadImage(
            file.buffer,
            file.mimetype,
            'galeria'
          );
          imagemUrl = uploadResult.url;
          thumbnailUrl = uploadResult.thumbnailUrl;
        } catch (error: any) {
          return res.status(500).json({
            success: false,
            message: `Erro ao fazer upload para Azure: ${error.message}`,
          });
        }
      } else if (imagem_url) {
        // Se não há arquivo mas há URL, usa a URL fornecida
        imagemUrl = imagem_url;
      } else {
        return res.status(400).json({
          success: false,
          message: 'É necessário enviar um arquivo de imagem ou fornecer uma URL',
        });
      }

      const sessionUser = req.session?.user;
      
      // Cria a imagem
      const imagem = em.create(Galeria, {
        imagem_url: imagemUrl,
        thumbnail_url: thumbnailUrl,
        descricao: descricao || null,
        titulo: titulo || null,
        jogo: jogo_id ? em.getReference(Jogo, jogo_id) : null,
        is_operacao: is_operacao === 'true' || is_operacao === true,
        nome_operacao: nome_operacao || null,
        data_operacao: data_operacao ? new Date(data_operacao) : null,
        autor_id: sessionUser?.id || null,
        categoria: categoria || null,
        album: album || null,
      } as any);

      await em.persistAndFlush(imagem);

      return res.status(201).json({
        success: true,
        data: imagem,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar imagem',
      });
    }
  }

  /**
   * Deleta uma imagem
   * Remove do banco de dados e do Azure Blob Storage
   */
  async delete(req: Request, res: Response) {
    try {
      const em = RequestContext.getEntityManager();
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager não disponível' });
      }

      const { id } = req.params;
      const imagem = await em.findOne(Galeria, { id });

      if (!imagem) {
        return res.status(404).json({
          success: false,
          message: 'Imagem não encontrada',
        });
      }

      // Deleta do Azure Blob Storage se o serviço estiver disponível
      if (this.azureBlobService && imagem.imagem_url) {
        try {
          // Verifica se a URL é do Azure Storage
          if (imagem.imagem_url.includes('.blob.core.windows.net')) {
            await this.azureBlobService.deleteImage(imagem.imagem_url);
          }
        } catch (error: any) {
          console.error('Erro ao deletar imagem do Azure (continuando mesmo assim):', error);
          // Continua mesmo se falhar ao deletar do Azure
        }
      }

      // Deleta do banco de dados
      await em.removeAndFlush(imagem);

      return res.status(200).json({
        success: true,
        message: 'Imagem deletada com sucesso',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao deletar imagem',
      });
    }
  }
}

