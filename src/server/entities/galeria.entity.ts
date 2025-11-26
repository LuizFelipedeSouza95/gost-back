import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';
import { Jogo } from './jogo.entity.js';

@Entity({ tableName: 'galeria', schema: process.env.DB_SCHEMA || 'public' })
export class Galeria extends BaseEntity {
  @Property({ type: 'text' })
  imagem_url!: string;

  @Property({ type: 'text', nullable: true })
  thumbnail_url?: string | null;

  @Property({ type: 'text', nullable: true })
  descricao?: string | null;

  @Property({ type: 'text', nullable: true })
  titulo?: string | null;

  @ManyToOne(() => Jogo, { nullable: true })
  jogo?: Jogo | null;

  @Property({ type: 'boolean', default: false })
  is_operacao: boolean = false;

  @Property({ type: 'text', nullable: true })
  nome_operacao?: string | null;

  @Property({ type: 'date', nullable: true })
  data_operacao?: Date | null;

  @Property({ type: 'text', nullable: true })
  autor_id?: string | null; // ID do usuário que adicionou a imagem

  @Property({ type: 'text', nullable: true })
  categoria?: string | null; // Ex: "Jogos", "Treinamentos", "Eventos"

  @Property({ type: 'text', nullable: true })
  album?: string | null; // Nome do álbum para agrupar fotos
}

