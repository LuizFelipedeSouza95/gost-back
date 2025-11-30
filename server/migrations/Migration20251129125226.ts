import { Migration } from '@mikro-orm/migrations';

export class Migration20251129125226 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "users" add column "telefone" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop column "telefone";`);
  }

}
