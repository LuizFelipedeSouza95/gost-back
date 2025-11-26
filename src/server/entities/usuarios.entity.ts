// src/entities/Usuario.ts
import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';
import type { InterfaceUser } from '../../utils/types';
import { Squad } from './squad.entity.js';

@Entity({ tableName: 'users', schema: process.env.DB_SCHEMA || 'public' })
export class Usuario extends BaseEntity implements InterfaceUser {
    @Property({ type: 'text', unique: true, nullable: true })
    googleId?: string | null;

    @Property({ type: 'text', unique: true })
    email!: string;

    @Property({ type: 'text', nullable: true })
    name?: string | null;

    @Property({ type: 'text', nullable: true })
    picture?: string | null;

    @Property({ type: 'json', default: '["user"]' })
    roles: string[] = ['user'];

    @Property({ type: 'Date', nullable: true })
    lastLogin?: Date;

    @Property({ type: 'text', nullable: true })
    password?: string | null;

    @Property({ type: 'json', nullable: true })
    comando_geral: string[] = [];

    @Property({ type: 'text', nullable: true })
    comando_squad: string | null = null;

    @Property({ type: 'text', nullable: true })
    classe: string = '';

    @Property({ type: 'text', nullable: true })
    data_admissao_gost: string = '';

    @Property({ type: 'text', nullable: true, default: 'recruta' })
    patent: "comando" | "comando_squad" | "soldado" | "sub_comando" | "recruta" = 'soldado';

    @Property({ type: 'boolean', nullable: false, default: true })
    active: boolean = true;

    @Property({ type: 'boolean', nullable: false, default: true })
    is_comandante_squad: boolean = false;

    @Property({ type: 'text', nullable: true })
    nome_squad_subordinado: string | null = null;

    @Property({ type: 'text', nullable: true })
    id_squad_subordinado: string | null = null;

    @Property({ type: 'text', nullable: true })
    nome_guerra: string | null = null;

    // Relacionamento com Squad
    @ManyToOne(() => Squad, { nullable: true })
    squad?: Squad | null;
}