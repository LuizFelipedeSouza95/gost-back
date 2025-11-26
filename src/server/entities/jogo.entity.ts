import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'jogos', schema: process.env.DB_SCHEMA || 'public' })
export class Jogo extends BaseEntity {
  @Property({ type: 'text', unique: true })
  nome_jogo!: string;

  @Property({ type: 'text', nullable: true })
  descricao_jogo?: string | null;

  @Property({ type: 'date', nullable: true })
  data_jogo?: Date | null;

  @Property({ type: 'text', nullable: true })
  local_jogo?: string | null;

  @Property({ type: 'text', nullable: true })
  hora_inicio?: string | null;

  @Property({ type: 'text', nullable: true })
  hora_fim?: string | null;

  @Property({ type: 'text', nullable: true })
  localizacao?: string | null; // Coordenadas ou endereço completo

  @Property({ type: 'json', default: '[]' })
  confirmations: string[] = []; // IDs dos usuários que confirmaram presença

  @Property({ 
    type: 'text', 
    default: 'scheduled'
  })
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' = 'scheduled';

  @Property({ type: 'text', nullable: true })
  capa_url?: string | null;

  @Property({ type: 'text', nullable: true })
  tipo_jogo?: string | null; // Ex: "Torneio", "Treinamento", "Jogo Amigável"

  @Property({ type: 'int', nullable: true })
  max_participantes?: number | null;

  @Property({ type: 'text', nullable: true })
  organizador_id?: string | null; // ID do usuário organizador
}

