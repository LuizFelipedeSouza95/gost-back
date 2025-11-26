import { Migration } from '@mikro-orm/migrations';

export class Migration20251126141802 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "recrutamentos" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "nome" text not null, "email" text not null, "telefone" text null, "idade" int null, "cidade" text null, "experiencia" text null, "equipamento" text null, "disponibilidade" text null, "motivacao" text null, "instagram" text null, "etapa_inscricao" text not null default 'pendente', "etapa_avaliacao" text not null default 'pendente', "etapa_qa" text not null default 'pendente', "etapa_votacao" text not null default 'pendente', "etapa_integracao" text not null default 'pendente', "responsavel_id" uuid null, "observacoes_inscricao" text null, "observacoes_avaliacao" text null, "observacoes_qa" text null, "observacoes_votacao" text null, "observacoes_integracao" text null, "votos" jsonb null, "status" text not null default 'ativo', "data_inscricao" date null, "data_avaliacao" date null, "data_qa" date null, "data_votacao" date null, "data_integracao" date null, "usuario_id" text null, constraint "recrutamentos_pkey" primary key ("id"));`);

    this.addSql(`alter table "recrutamentos" add constraint "recrutamentos_responsavel_id_foreign" foreign key ("responsavel_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "galeria" add column "album" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "recrutamentos" cascade;`);

    this.addSql(`alter table "galeria" drop column "album";`);
  }

}
