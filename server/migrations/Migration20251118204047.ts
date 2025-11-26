import { Migration } from '@mikro-orm/migrations';

export class Migration20251118204047 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "jogos" alter column "status" type text using ("status"::text);`);

    this.addSql(`alter table "treinamentos" alter column "status" type text using ("status"::text);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "jogos" alter column "status" type smallint using ("status"::smallint);`);

    this.addSql(`alter table "treinamentos" alter column "status" type smallint using ("status"::smallint);`);
  }

}
