import { Migration } from '@mikro-orm/migrations';

export class Migration20251118203737 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "equipe" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "nome" text not null, "objetivo" text null, "data_criacao" date null, "descricao" text null, "logo_url" text null, "email" text null, "telefone" text null, "endereco" text null, "cidade" text null, "estado" text null, constraint "equipe_pkey" primary key ("id"));`);

    this.addSql(`create table "faqs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "pergunta" text not null, "resposta" text not null, "categoria" text null, "ordem_exibicao" int not null default 0, "visualizacoes" int not null default 0, "ativo" boolean not null default true, constraint "faqs_pkey" primary key ("id"));`);

    this.addSql(`create table "jogos" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "nome_jogo" text not null, "descricao_jogo" text null, "data_jogo" date null, "local_jogo" text null, "hora_inicio" text null, "hora_fim" text null, "localizacao" text null, "confirmations" jsonb not null default '[]', "status" text not null default 'scheduled', "capa_url" text null, "tipo_jogo" text null, "max_participantes" int null, "organizador_id" text null, constraint "jogos_pkey" primary key ("id"));`);
    this.addSql(`alter table "jogos" add constraint "jogos_nome_jogo_unique" unique ("nome_jogo");`);

    this.addSql(`create table "galeria" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "imagem_url" text not null, "thumbnail_url" text null, "descricao" text null, "titulo" text null, "jogo_id" uuid null, "is_operacao" boolean not null default false, "nome_operacao" text null, "data_operacao" date null, "autor_id" text null, "categoria" text null, constraint "galeria_pkey" primary key ("id"));`);

    this.addSql(`create table "noticias" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "titulo" text not null, "conteudo" text not null, "resumo" text null, "imagem_url" text null, "autor_id" text null, "autor_nome" text null, "publicado" boolean not null default true, "data_publicacao" date null, "categoria" text null, "visualizacoes" int not null default 0, "tags" jsonb not null default '[]', constraint "noticias_pkey" primary key ("id"));`);

    this.addSql(`create table "parceiros" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "nome" text not null, "descricao" text null, "logo_url" text null, "website" text null, "email" text null, "telefone" text null, "endereco" text null, "tipo" text null, "ordem_exibicao" int not null default 0, "ativo" boolean not null default true, constraint "parceiros_pkey" primary key ("id"));`);

    this.addSql(`create table "squads" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "nome" text not null, "descricao" text null, "comando_squad" text null, "comando_geral" jsonb null, "cor" text null, "logo_url" text null, "ativo" boolean not null default true, constraint "squads_pkey" primary key ("id"));`);
    this.addSql(`alter table "squads" add constraint "squads_nome_unique" unique ("nome");`);

    this.addSql(`create table "treinamentos" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "titulo" text not null, "descricao" text not null, "conteudo" text null, "data_treinamento" date null, "local" text null, "instrutor_id" text null, "instrutor_nome" text null, "tipo" text null, "duracao_minutos" int null, "max_participantes" int null, "participantes" jsonb not null default '[]', "material_necessario" text null, "ativo" boolean not null default true, "status" text not null default 'agendado', constraint "treinamentos_pkey" primary key ("id"));`);

    this.addSql(`create table "users" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "google_id" text null, "email" text not null, "name" text null, "picture" text null, "roles" jsonb not null default '["user"]', "last_login" timestamptz null, "password" text null, "comando_geral" jsonb null, "comando_squad" text null, "classe" text null default '', "data_admissao_gost" text null default '', "patent" text null default 'recruta', "active" boolean not null default true, "is_comandante_squad" boolean not null default true, "nome_squad_subordinado" text null, "id_squad_subordinado" text null, "nome_guerra" text null, "squad_id" uuid null, constraint "users_pkey" primary key ("id"));`);
    this.addSql(`alter table "users" add constraint "users_google_id_unique" unique ("google_id");`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);

    this.addSql(`alter table "galeria" add constraint "galeria_jogo_id_foreign" foreign key ("jogo_id") references "jogos" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "users" add constraint "users_squad_id_foreign" foreign key ("squad_id") references "squads" ("id") on update cascade on delete set null;`);
  }

}
