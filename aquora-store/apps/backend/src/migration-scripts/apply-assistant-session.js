// Out-of-band migration for the `assistant` module's assistant_session table.
// The Medusa `db:migrate` CLI hangs in a Cloud Run Job here (documented in the Dockerfile);
// the reliable path is this tiny idempotent `pg` script run as a short-lived job with the
// Cloud SQL instance attached + DATABASE_URL from Secret Manager. Mirrors the SQL in
// src/modules/assistant/migrations/Migration20260701120000.ts.
function loadPg() {
  const candidates = ["pg", "/app/.medusa/server/node_modules/pg", "/app/node_modules/pg"]
  for (const p of candidates) {
    try {
      return require(p)
    } catch (_e) {}
  }
  throw new Error("pg module not found")
}

const { Client } = loadPg()

const SQL = [
  `create table if not exists "assistant_session" ("id" text not null, "conversation_id" text not null, "visitor_id" text not null, "customer_id" text null, "message" text null, "reply" text null, "tools_used" jsonb null, "suggestions" jsonb null, "cta" text null, "had_image" boolean not null default false, "had_audio" boolean not null default false, "ai" boolean not null default false, "converted" boolean not null default false, "order_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "assistant_session_pkey" primary key ("id"));`,
  `CREATE INDEX IF NOT EXISTS "IDX_assistant_session_deleted_at" ON "assistant_session" ("deleted_at") WHERE deleted_at IS NULL;`,
  `CREATE INDEX IF NOT EXISTS "IDX_assistant_session_visitor_id" ON "assistant_session" ("visitor_id");`,
  `CREATE INDEX IF NOT EXISTS "IDX_assistant_session_conversation_id" ON "assistant_session" ("conversation_id");`,
]

;(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  for (const stmt of SQL) await client.query(stmt)
  const r = await client.query("select to_regclass('public.assistant_session') as t")
  console.log("ASSISTANT_SESSION_TABLE=" + (r.rows[0] && r.rows[0].t))
  await client.end()
  process.exit(0)
})().catch((e) => {
  console.error("MIGRATION_ERROR=" + (e && e.message ? e.message : e))
  process.exit(1)
})
