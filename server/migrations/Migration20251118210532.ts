import { Migration } from '@mikro-orm/migrations';

export class Migration20251118210532 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "squads" add column "comandante_id" uuid null;`);
    this.addSql(`alter table "squads" add constraint "squads_comandante_id_foreign" foreign key ("comandante_id") references "users" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "squads" drop constraint "squads_comandante_id_foreign";`);

    this.addSql(`alter table "squads" drop column "comandante_id";`);
  }

}
