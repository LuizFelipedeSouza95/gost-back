import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'equipe', schema: process.env.DB_SCHEMA || 'public' })
export class Equipe extends BaseEntity {
  @Property({ type: 'text', nullable: false })
  nome!: string;

  @Property({ type: 'text', nullable: true })
  significado_nome?: string | null;

  @Property({ type: 'text', nullable: true })
  objetivo?: string | null;

  @Property({ type: 'date', nullable: true })
  data_criacao?: Date | null;

  @Property({ type: 'text', nullable: true, length: 2000 })
  descricao?: string | null;

  @Property({ type: 'text', nullable: true })
  logo_url?: string | null;

  @Property({ type: 'text', nullable: true })
  email?: string | null;

  @Property({ type: 'text', nullable: true })
  telefone?: string | null;

  @Property({ type: 'text', nullable: true })
  endereco?: string | null;

  @Property({ type: 'text', nullable: true })
  cidade?: string | null;

  @Property({ type: 'text', nullable: true })
  estado?: string | null;

  @Property({ type: 'text', nullable: true })
  instagram_url?: string | null;

  @Property({ type: 'text', nullable: true })
  whatsapp_url?: string | null;
}

