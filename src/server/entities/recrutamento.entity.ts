import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';
import { Usuario } from './usuarios.entity.js';

export type EtapaStatus = 'pendente' | 'aprovado' | 'reprovado';
export type EtapaTipo = 'inscricao' | 'avaliacao' | 'qa' | 'votacao' | 'integracao';

@Entity({ tableName: 'recrutamentos', schema: process.env.DB_SCHEMA || 'public' })
export class Recrutamento extends BaseEntity {
  @Property({ type: 'text' })
  nome!: string;

  @Property({ type: 'text' })
  email!: string;

  @Property({ type: 'text', nullable: true })
  telefone?: string | null;

  @Property({ type: 'int', nullable: true })
  idade?: number | null;

  @Property({ type: 'text', nullable: true })
  cidade?: string | null;

  @Property({ type: 'text', nullable: true })
  experiencia?: string | null;

  @Property({ type: 'text', nullable: true })
  equipamento?: string | null;

  @Property({ type: 'text', nullable: true })
  disponibilidade?: string | null;

  @Property({ type: 'text', nullable: true })
  motivacao?: string | null;

  @Property({ type: 'text', nullable: true })
  instagram?: string | null;

  // Etapas do processo
  @Property({ type: 'text', default: 'pendente' })
  etapa_inscricao: EtapaStatus = 'pendente';

  @Property({ type: 'text', default: 'pendente' })
  etapa_avaliacao: EtapaStatus = 'pendente';

  @Property({ type: 'text', default: 'pendente' })
  etapa_qa: EtapaStatus = 'pendente';

  @Property({ type: 'text', default: 'pendente' })
  etapa_votacao: EtapaStatus = 'pendente';

  @Property({ type: 'text', default: 'pendente' })
  etapa_integracao: EtapaStatus = 'pendente';

  // Responsável pelo processo
  @ManyToOne(() => Usuario, { nullable: true })
  responsavel?: Usuario | null;

  // Observações e feedbacks
  @Property({ type: 'text', nullable: true })
  observacoes_inscricao?: string | null;

  @Property({ type: 'text', nullable: true })
  observacoes_avaliacao?: string | null;

  @Property({ type: 'text', nullable: true })
  observacoes_qa?: string | null;

  @Property({ type: 'text', nullable: true })
  observacoes_votacao?: string | null;

  @Property({ type: 'text', nullable: true })
  observacoes_integracao?: string | null;

  // Votos na etapa de votação (JSON com { usuario_id: 'aprovado' | 'reprovado' })
  @Property({ type: 'json', nullable: true })
  votos?: Record<string, 'aprovado' | 'reprovado'> | null;

  // Status geral
  @Property({ type: 'text', default: 'ativo' })
  status: 'ativo' | 'aprovado' | 'reprovado' | 'cancelado' = 'ativo';

  // Data de cada etapa
  @Property({ type: 'date', nullable: true })
  data_inscricao?: Date | null;

  @Property({ type: 'date', nullable: true })
  data_avaliacao?: Date | null;

  @Property({ type: 'date', nullable: true })
  data_qa?: Date | null;

  @Property({ type: 'date', nullable: true })
  data_votacao?: Date | null;

  @Property({ type: 'date', nullable: true })
  data_integracao?: Date | null;

  // ID do usuário que criou (se logado)
  @Property({ type: 'text', nullable: true })
  usuario_id?: string | null;
}

