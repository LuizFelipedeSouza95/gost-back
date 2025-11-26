import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'estatuto', schema: process.env.DB_SCHEMA || 'public' })
export class Estatuto extends BaseEntity {
  @Property({ type: 'text', nullable: false })
  titulo!: string;

  @Property({ type: 'text', nullable: true })
  descricao?: string | null;

  @Property({ type: 'jsonb', nullable: false })
  conteudo!: {
    topics: Array<{
      id: string;
      icon?: string;
      title: string;
      description: string;
      content: {
        sections: Array<{
          title: string;
          items: Array<{
            position?: string;
            members?: string;
            additional?: string;
            text?: string;
            label?: string;
          }>;
        }>;
      };
    }>;
  };
}

