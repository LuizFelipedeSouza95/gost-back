import { Migration } from '@mikro-orm/migrations';

export class Migration20251126210625 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "noticias" add column "destaque" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "noticias" drop column "destaque";`);
  }

}
