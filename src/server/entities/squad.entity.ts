import { Entity, Property, OneToMany, ManyToOne, Collection } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';
import { Usuario } from './usuarios.entity.js';

@Entity({ tableName: 'squads', schema: process.env.DB_SCHEMA || 'public' })
export class Squad extends BaseEntity {
  @Property({ type: 'text', unique: true })
  nome!: string;

  @Property({ type: 'text', nullable: true })
  descricao?: string | null;

  @Property({ type: 'text', nullable: true })
  comando_squad?: string | null;

  @Property({ type: 'json', nullable: true })
  comando_geral: string[] = [];

  @Property({ type: 'text', nullable: true })
  cor?: string | null; // Cor do squad para identificação visual

  @Property({ type: 'text', nullable: true })
  logo_url?: string | null;

  @Property({ type: 'boolean', default: true })
  ativo: boolean = true;

  // Relacionamento com comandante do squad
  @ManyToOne(() => Usuario, { nullable: true })
  comandante?: Usuario | null;

  // Relacionamento com usuários (membros do squad)
  @OneToMany(() => Usuario, (usuario) => usuario.squad)
  membros = new Collection<Usuario>(this);
}

