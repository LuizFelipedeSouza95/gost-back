import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'treinamentos', schema: process.env.DB_SCHEMA || 'public' })
export class Treinamento extends BaseEntity {
  @Property({ type: 'text' })
  titulo!: string;

  @Property({ type: 'text' })
  descricao!: string;

  @Property({ type: 'text', nullable: true })
  conteudo?: string | null; // Conteúdo detalhado do treinamento

  @Property({ type: 'date', nullable: true })
  data_treinamento?: Date | null;

  @Property({ type: 'text', nullable: true })
  local?: string | null;

  @Property({ type: 'text', nullable: true })
  instrutor_id?: string | null; // ID do usuário instrutor

  @Property({ type: 'text', nullable: true })
  instrutor_nome?: string | null;

  @Property({ type: 'text', nullable: true })
  tipo?: string | null; // Ex: "Tático", "Físico", "Tiro", "Estratégia"

  @Property({ type: 'int', nullable: true })
  duracao_minutos?: number | null;

  @Property({ type: 'int', nullable: true })
  max_participantes?: number | null;

  @Property({ type: 'json', default: '[]' })
  participantes: string[] = []; // IDs dos usuários participantes

  @Property({ type: 'text', nullable: true })
  material_necessario?: string | null;

  @Property({ type: 'boolean', default: true })
  ativo: boolean = true;

  @Property({ 
    type: 'text', 
    default: 'agendado'
  })
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado' = 'agendado';
}

