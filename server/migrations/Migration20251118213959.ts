import { Migration } from '@mikro-orm/migrations';

export class Migration20251118213959 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "equipe" add column "significado_nome" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "equipe" drop column "significado_nome";`);
  }

}
