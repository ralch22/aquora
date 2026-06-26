# Next.js 15 storefront for Cloud Run.
# NEXT_PUBLIC_* values are read from .env.production (written at deploy time) and
# inlined at build, so the client knows the public backend URL.
FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .
RUN npm run build

ENV NODE_ENV=production
CMD ["sh", "-c", "npx next start -p ${PORT:-8000}"]
