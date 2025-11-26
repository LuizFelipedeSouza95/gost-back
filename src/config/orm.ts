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
  ],
  metadataProvider: ReflectMetadataProvider,
  debug: process.env.NODE_ENV !== 'production',
  driverOptions: (() => {
    const useSSL = process.env.DB_USE_SSL === 'true';
    const baseOptions: any = {
      connection: {
        // Configurações de pool para melhor gerenciamento de conexões
        max: 20, // máximo de conexões no pool (aumentado)
        min: 2, // mínimo de conexões mantidas no pool
        idleTimeoutMillis: 60000, // fecha conexões idle após 60s (aumentado)
        connectionTimeoutMillis: 10000, // timeout ao conectar (aumentado para 10s)
        // Keep-alive para manter conexões vivas (PostgreSQL)
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      },
      // Timeouts para queries
      statement_timeout: 30000, // timeout para statements (30s)
      query_timeout: 30000, // timeout para queries individuais (30s)
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

