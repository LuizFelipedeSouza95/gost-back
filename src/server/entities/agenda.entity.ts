import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'agenda', schema: process.env.DB_SCHEMA || 'public' })
export class Agenda extends BaseEntity {
  @Property({ type: 'text' })
  titulo!: string;

  @Property({ type: 'text', nullable: true })
  descricao?: string | null; // Pode conter logo_url:URL no formato logo_url:URL

  @Property({ type: 'date' })
  data!: Date;

  @Property({ type: 'text', nullable: true })
  local?: string | null;

  @Property({ type: 'text', nullable: true })
  tipo?: string | null; // Ex: 'Reunião', 'Treinamento', 'Evento', etc.

  @Property({ type: 'boolean', default: true })
  ativo: boolean = true;

  @Property({ type: 'int', nullable: true })
  ordem?: number | null; // Para ordenação personalizada
}

