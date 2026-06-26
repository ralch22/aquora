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
# Cloud Run injects PORT; Medusa reads it. Start the server (DB is pre-migrated).
CMD ["npm", "run", "start"]
