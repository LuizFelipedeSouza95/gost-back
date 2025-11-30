import 'reflect-metadata';
import 'dotenv/config';
import { Options, ReflectMetadataProvider } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Usuario } from '../server/entities/usuarios.entity.js';
import { Squad } from '../server/entities/squad.entity.js';
import { Jogo } from '../server/entities/jogo.entity.js';
import { Galeria } from '../server/entities/galeria.entity.js';
import { Noticia } from '../server/entities/noticia.entity.js';
import { Parceiro } from '../server/entities/parceiro.entity.js';
import { Treinamento } from '../server/entities/treinamento.entity.js';
import { FAQ } from '../server/entities/faq.entity.js';
import { Equipe } from '../server/entities/equipe.entity.js';
import { Estatuto } from '../server/entities/estatuto.entity.js';
import { Recrutamento } from '../server/entities/recrutamento.entity.js';
import { Agenda } from '../server/entities/agenda.entity.js';

const config: Options = {
  migrations: {
    path: './dist/migrations',
    pathTs: './server/migrations',
    tableName: 'gost_migrations',
    transactional: true,
    glob: '!(*.d).{js,ts}',
  },
  driver: PostgreSqlDriver,
  clientUrl: process.env.DATABASE_URL || process.env.GOST_DATABASE_URL,
  schema: process.env.DB_SCHEMA || 'public',
  entities: [
    Usuario,
    Squad,
    Jogo,
    Galeria,
    Noticia,
    Parceiro,
    Treinamento,
    FAQ,
    Equipe,
    Estatuto,
    Recrutamento,
    Agenda,
  ],
  metadataProvider: ReflectMetadataProvider,
  debug: process.env.NODE_ENV !== 'production',
  driverOptions: (() => {
    const useSSL = process.env.DB_USE_SSL === 'true';
    const baseOptions: any = {
      connection: {
        max: 20,
        min: 2,
        idleTimeoutMillis: 60000,
        connectionTimeoutMillis: 10000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      },
      statement_timeout: 30000,
      query_timeout: 30000,
    };
    if (useSSL) {
      baseOptions.connection.ssl = {
        rejectUnauthorized: false,
      };
    }
    return baseOptions;
  })(),
};

export default config;

