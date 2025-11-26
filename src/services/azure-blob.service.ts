import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

export class AzureBlobService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'galeria';

    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING não configurada no .env');
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
  }

  /**
   * Garante que o container existe
   */
  async ensureContainerExists(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists({
        access: 'blob', // Permite acesso público aos blobs
      });
    } catch (error: any) {
      console.error('Erro ao criar/verificar container:', error);
      throw error;
    }
  }

  /**
   * Faz upload de uma imagem para o Azure Blob Storage
   * @param file Buffer do arquivo
   * @param mimeType Tipo MIME da imagem (ex: image/jpeg)
   * @param folder Pasta onde salvar (opcional, padrão: 'images')
   * @returns URL pública da imagem
   */
  async uploadImage(
    file: Buffer,
    mimeType: string,
    folder: string = 'images'
  ): Promise<{ url: string; thumbnailUrl?: string }> {
    try {
      await this.ensureContainerExists();

      // Gera nome único para o arquivo
      const fileExtension = this.getFileExtension(mimeType);
      const fileName = `${folder}/${uuidv4()}${fileExtension}`;

      // Upload do arquivo principal
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.upload(file, file.length, {
        blobHTTPHeaders: {
          blobContentType: mimeType,
        },
      });

      const url = blockBlobClient.url;

      // Gera thumbnail se for imagem
      let thumbnailUrl: string | undefined;
      if (mimeType.startsWith('image/')) {
        try {
          // Para simplificar, vamos usar a mesma imagem como thumbnail por enquanto
          // Em produção, você pode usar uma biblioteca como sharp para gerar thumbnails
          thumbnailUrl = url;
        } catch (error) {
          console.warn('Erro ao gerar thumbnail:', error);
        }
      }

      return { url, thumbnailUrl };
    } catch (error: any) {
      console.error('Erro ao fazer upload para Azure:', error);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }
  }

  /**
   * Deleta uma imagem do Azure Blob Storage
   * @param imageUrl URL completa da imagem
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extrai o nome do blob da URL
      const blobName = this.extractBlobNameFromUrl(imageUrl);
      if (!blobName) {
        throw new Error('URL inválida');
      }

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
    } catch (error: any) {
      console.error('Erro ao deletar imagem do Azure:', error);
      throw new Error(`Erro ao deletar imagem: ${error.message}`);
    }
  }

  /**
   * Extrai a extensão do arquivo baseado no MIME type
   */
  private getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };

    return mimeToExt[mimeType.toLowerCase()] || '.jpg';
  }

  /**
   * Extrai o nome do blob da URL completa
   */
  private extractBlobNameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Remove o container name do path
      const pathParts = urlObj.pathname.split('/');
      const containerIndex = pathParts.findIndex(part => part === this.containerName);
      if (containerIndex === -1) return null;
      
      return pathParts.slice(containerIndex + 1).join('/');
    } catch {
      return null;
    }
  }
}

