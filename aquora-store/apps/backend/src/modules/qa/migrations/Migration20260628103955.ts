import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260628103955 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "question" ("id" text not null, "product_id" text not null, "body" text not null, "author_name" text not null, "email" text null, "answer" text null, "answered_by" text null, "status" text check ("status" in ('pending', 'published', 'rejected')) not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "question_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_question_deleted_at" ON "question" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "question" cascade;`);
  }

}
