import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'parceiros', schema: process.env.DB_SCHEMA || 'public' })
export class Parceiro extends BaseEntity {
  @Property({ type: 'text' })
  nome!: string;

  @Property({ type: 'text', nullable: true })
  descricao?: string | null;

  @Property({ type: 'text', nullable: true })
  logo_url?: string | null;

  @Property({ type: 'text', nullable: true })
  website?: string | null;

  @Property({ type: 'text', nullable: true })
  email?: string | null;

  @Property({ type: 'text', nullable: true })
  telefone?: string | null;

  @Property({ type: 'text', nullable: true })
  endereco?: string | null;

  @Property({ type: 'text', nullable: true })
  tipo?: string | null; // Ex: "Loja", "Campo", "Fabricante", "Patrocinador"

  @Property({ type: 'int', default: 0 })
  ordem_exibicao: number = 0; // Para ordenar na página

  @Property({ type: 'boolean', default: true })
  ativo: boolean = true;
}

