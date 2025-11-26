import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'faqs', schema: process.env.DB_SCHEMA || 'public' })
export class FAQ extends BaseEntity {
  @Property({ type: 'text' })
  pergunta!: string;

  @Property({ type: 'text' })
  resposta!: string;

  @Property({ type: 'text', nullable: true })
  categoria?: string | null; // Ex: "Geral", "Recrutamento", "Equipamentos"

  @Property({ type: 'int', default: 0 })
  ordem_exibicao: number = 0; // Para ordenar as FAQs

  @Property({ type: 'int', default: 0 })
  visualizacoes: number = 0;

  @Property({ type: 'boolean', default: true })
  ativo: boolean = true;
}

