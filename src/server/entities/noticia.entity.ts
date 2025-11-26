import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'noticias', schema: process.env.DB_SCHEMA || 'public' })
export class Noticia extends BaseEntity {
  @Property({ type: 'text' })
  titulo!: string;

  @Property({ type: 'text' })
  conteudo!: string;

  @Property({ type: 'text', nullable: true })
  resumo?: string | null;

  @Property({ type: 'text', nullable: true })
  imagem_url?: string | null;

  @Property({ type: 'text', nullable: true })
  autor_id?: string | null; // ID do usuário autor

  @Property({ type: 'text', nullable: true })
  autor_nome?: string | null;

  @Property({ type: 'boolean', default: true })
  publicado: boolean = true;

  @Property({ type: 'date', nullable: true })
  data_publicacao?: Date | null;

  @Property({ type: 'text', nullable: true })
  categoria?: string | null; // Ex: "Geral", "Eventos", "Torneios"

  @Property({ type: 'int', default: 0 })
  visualizacoes: number = 0;

  @Property({ type: 'json', default: '[]' })
  tags: string[] = [];
}

