# Medusa v2 backend for Cloud Run
FROM node:22-slim

WORKDIR /app

# native build deps (some Medusa deps compile)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .
RUN npm run build

# the production server is emitted to .medusa/server with its own package.json
WORKDIR /app/.medusa/server
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

ENV NODE_ENV=production
# Start the built server. The DB is migrated OUT OF BAND, NOT on boot: a blocking `medusa
# db:migrate` exceeds Cloud Run's 240s startup probe, and backgrounding it starves the single-CPU
# instance so `start` also misses the probe. When a deploy adds/changes a module migration, apply
# it via a short-lived Cloud Run Job attached to the same Cloud SQL instance + DATABASE_URL. The
# Medusa migrate CLI bootstraps slowly and often hangs without exiting, so the reliable path is a
# tiny `pg` script that runs the generated migration's raw SQL (idempotent CREATE TABLE IF NOT
# EXISTS) and exits — see the review module's migration for the SQL.
CMD ["npm", "run", "start"]
