import { Migration } from '@mikro-orm/migrations';

export class Migration20251130034700 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "agenda" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "titulo" text not null, "descricao" text null, "data" date not null, "hora" text null, "local" text null, "tipo" text null, "ativo" boolean not null default true, "ordem" int null, constraint "agenda_pkey" primary key ("id"));`);

    this.addSql(`alter table "users" alter column "patent" type text using ("patent"::text);`);
    this.addSql(`alter table "users" alter column "patent" set default 'interessado';`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "agenda" cascade;`);

    this.addSql(`alter table "users" alter column "patent" type text using ("patent"::text);`);
    this.addSql(`alter table "users" alter column "patent" set default 'recruta';`);
  }

}
