# Datum backend — production image
FROM node:22-slim

# openssl + ca-certificates: Prisma's query engine needs these on Debian
# poppler-utils: provides `pdftoppm`, used to rasterise drawing previews
RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first so this layer caches across code-only changes
   COPY package.json package-lock.json* ./
   COPY prisma ./prisma
   RUN npm install --omit=dev

COPY . .

RUN mkdir -p /app/storage
ENV NODE_ENV=production
ENV STORAGE_DIR=/app/storage
EXPOSE 4000

# Applies any pending migrations, then boots the API. Safe to run on every
# deploy — `migrate deploy` is a no-op if the schema is already current.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/server.js"]
