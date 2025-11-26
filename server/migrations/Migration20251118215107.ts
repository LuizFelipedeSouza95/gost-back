import { Migration } from '@mikro-orm/migrations';

export class Migration20251118215107 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "estatuto" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "titulo" text not null, "descricao" text null, "conteudo" jsonb not null, constraint "estatuto_pkey" primary key ("id"));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "estatuto" cascade;`);
  }

}
