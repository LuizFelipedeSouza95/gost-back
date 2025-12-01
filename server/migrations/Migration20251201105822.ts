import { Migration } from '@mikro-orm/migrations';

export class Migration20251201105822 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "agenda" drop column "hora";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "agenda" add column "hora" text null;`);
  }

}
