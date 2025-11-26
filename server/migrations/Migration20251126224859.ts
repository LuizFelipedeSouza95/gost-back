import { Migration } from '@mikro-orm/migrations';

export class Migration20251126224859 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "equipe" add column "instagram_url" text null, add column "whatsapp_url" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "equipe" drop column "instagram_url", drop column "whatsapp_url";`);
  }

}
