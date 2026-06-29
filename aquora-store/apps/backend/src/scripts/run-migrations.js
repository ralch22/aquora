#!/usr/bin/env node
/**
 * Out-of-band Medusa module migration runner (WS0-PR5).
 *
 * WHY THIS EXISTS
 * ---------------
 * Boot-time migration is unreliable on Cloud Run here: a blocking `medusa db:migrate`
 * exceeds the 240s startup probe, backgrounding it starves the single CPU, and the
 * Medusa migrate CLI bootstraps slowly and frequently hangs without exiting (see the
 * backend Dockerfile + AGENTS.md "Backend migrations" section). So module migrations are
 * applied OUT OF BAND: a short-lived Cloud Run Job, built from the backend image with the
 * aquora-db Cloud SQL instance attached, runs this tiny `pg` script and exits.
 *
 * WHAT IT DOES
 * ------------
 * Discovers every module migration under src/modules/<m>/migrations/Migration*.{ts,js},
 * extracts the raw SQL its up() method enqueues via this.addSql(`...`), and applies it
 * idempotently against DATABASE_URL. The generated SQL is already CREATE TABLE/INDEX IF
 * NOT EXISTS, and each migration is recorded in a tracking table so re-running is a no-op.
 *
 * USAGE
 * -----
 *   DATABASE_URL=postgres://... node src/scripts/run-migrations.js
 * From the backend image (WORKDIR /app/.medusa/server) the Cloud Run Job runs it with an
 * absolute path so Node resolves `pg` and the migration source from /app:
 *   node /app/src/scripts/run-migrations.js
 *
 * It connects with `pg` only (no Medusa bootstrap), so it never hangs the way the CLI does.
 * Exits 0 on success (including the no-op re-run case) and non-zero on any failure.
 *
 * NEVER prints DATABASE_URL or any secret.
 */

const fs = require("fs")
const path = require("path")
const { Client } = require("pg")

const TRACKING_TABLE = "aquora_oob_migrations"

// Resolve the modules root that holds <module>/migrations/. Prefer an explicit override,
// then the location relative to this script (works both from source and from a build that
// keeps the src/ tree), then common fallbacks for the Cloud Run image and local runs.
function resolveModulesDir() {
  const candidates = [
    process.env.MIGRATIONS_DIR,
    path.resolve(__dirname, "..", "modules"),
    path.resolve(process.cwd(), "src", "modules"),
    "/app/src/modules",
  ].filter(Boolean)
  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      return dir
    }
  }
  throw new Error(
    `Could not locate a modules directory (tried: ${candidates.join(", ")}). ` +
      `Set MIGRATIONS_DIR to the path containing <module>/migrations/.`
  )
}

// Find every migration file across all modules. Prefer .ts source (always shipped in the
// image via `COPY . .`); fall back to compiled .js if a build dropped the source.
function findMigrationFiles(modulesDir) {
  const files = []
  for (const moduleName of fs.readdirSync(modulesDir)) {
    const migrationsDir = path.join(modulesDir, moduleName, "migrations")
    if (!fs.existsSync(migrationsDir) || !fs.statSync(migrationsDir).isDirectory()) {
      continue
    }
    const entries = fs.readdirSync(migrationsDir)
    const tsFiles = entries.filter((f) => /^Migration.*\.ts$/.test(f) && !f.endsWith(".d.ts"))
    const jsFiles = entries.filter((f) => /^Migration.*\.js$/.test(f))
    const chosen = tsFiles.length ? tsFiles : jsFiles
    for (const f of chosen) {
      files.push({
        module: moduleName,
        name: path.basename(f).replace(/\.(ts|js)$/, ""),
        file: path.join(migrationsDir, f),
      })
    }
  }
  // Apply in deterministic timestamp order (the generated names are Migration<UTC stamp>).
  files.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  return files
}

// Extract the body of the up() method via brace matching, so down()'s drop statements are
// never executed.
function extractUpBody(source) {
  const sig = /\bup\s*\([^)]*\)\s*:\s*[^={]*\{/.exec(source)
  if (!sig) return null
  let depth = 0
  const start = sig.index + sig[0].length // first char inside the opening brace
  for (let i = start - 1; i < source.length; i++) {
    const ch = source[i]
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return source.slice(start, i)
    }
  }
  return null
}

// Pull every SQL string passed to this.addSql(`...`) within the given code block. Handles
// multiple calls and multi-line/escaped-backtick template literals.
function extractSql(upBody) {
  const statements = []
  const re = /addSql\s*\(\s*`/g
  let m
  while ((m = re.exec(upBody)) !== null) {
    let i = m.index + m[0].length // first char after the opening backtick
    let sql = ""
    while (i < upBody.length) {
      const ch = upBody[i]
      if (ch === "\\") {
        sql += upBody[i + 1] === "`" ? "`" : ch + (upBody[i + 1] ?? "")
        i += 2
        continue
      }
      if (ch === "`") break
      sql += ch
      i++
    }
    const trimmed = sql.trim()
    if (trimmed) statements.push(trimmed)
    re.lastIndex = i + 1
  }
  return statements
}

async function ensureTrackingTable(client) {
  await client.query(
    `create table if not exists "${TRACKING_TABLE}" (` +
      `"name" text not null, ` +
      `"module" text not null, ` +
      `"applied_at" timestamptz not null default now(), ` +
      `constraint "${TRACKING_TABLE}_pkey" primary key ("name"));`
  )
}

async function appliedMigrations(client) {
  const res = await client.query(`select "name" from "${TRACKING_TABLE}";`)
  return new Set(res.rows.map((r) => r.name))
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set — refusing to run migrations.")
    process.exit(1)
  }

  const modulesDir = resolveModulesDir()
  const migrations = findMigrationFiles(modulesDir)
  console.log(
    `Found ${migrations.length} module migration(s) under ${modulesDir}: ` +
      migrations.map((mg) => `${mg.module}/${mg.name}`).join(", ")
  )

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  let applied = 0
  let skipped = 0
  try {
    await ensureTrackingTable(client)
    const done = await appliedMigrations(client)

    for (const mg of migrations) {
      if (done.has(mg.name)) {
        skipped++
        console.log(`• skip   ${mg.module}/${mg.name} (already applied)`)
        continue
      }

      const source = fs.readFileSync(mg.file, "utf8")
      const upBody = extractUpBody(source)
      if (upBody === null) {
        throw new Error(`Could not parse up() in ${mg.file}`)
      }
      const statements = extractSql(upBody)
      if (!statements.length) {
        console.warn(`! ${mg.module}/${mg.name} has no SQL in up() — recording as applied.`)
      }

      // Each migration is atomic: all of its idempotent statements + the tracking row
      // commit together, or nothing does.
      await client.query("BEGIN")
      try {
        for (const sql of statements) {
          await client.query(sql)
        }
        await client.query(
          `insert into "${TRACKING_TABLE}" ("name", "module") values ($1, $2) ` +
            `on conflict ("name") do nothing;`,
          [mg.name, mg.module]
        )
        await client.query("COMMIT")
      } catch (err) {
        await client.query("ROLLBACK")
        throw err
      }
      applied++
      console.log(`✓ apply  ${mg.module}/${mg.name} (${statements.length} statement(s))`)
    }
  } finally {
    await client.end()
  }

  console.log(`Done. applied=${applied} skipped=${skipped} total=${migrations.length}`)
}

main().catch((err) => {
  // Log the message only — never the connection string or any secret payload.
  console.error("Migration runner failed:", err && err.message ? err.message : err)
  process.exit(1)
})
