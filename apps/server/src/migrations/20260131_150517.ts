import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "published_at" timestamp(3) with time zone NOT NULL;
  CREATE INDEX "pages_published_at_idx" ON "pages" USING btree ("published_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "pages_published_at_idx";
  ALTER TABLE "pages" DROP COLUMN "published_at";`)
}
