import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260701120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "assistant_session" ("id" text not null, "conversation_id" text not null, "visitor_id" text not null, "customer_id" text null, "message" text null, "reply" text null, "tools_used" jsonb null, "suggestions" jsonb null, "cta" text null, "had_image" boolean not null default false, "had_audio" boolean not null default false, "ai" boolean not null default false, "converted" boolean not null default false, "order_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "assistant_session_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_assistant_session_deleted_at" ON "assistant_session" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_assistant_session_visitor_id" ON "assistant_session" ("visitor_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_assistant_session_conversation_id" ON "assistant_session" ("conversation_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "assistant_session" cascade;`);
  }

}
