FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY . .
ENV NITRO_PRESET=node-server
RUN npx vite build

ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
EXPOSE 3000
CMD ["sh", "-c", "node scripts/migrate.mjs && if [ -f .output/server/index.mjs ]; then exec node .output/server/index.mjs; elif [ -f .output/server/index.js ]; then exec node .output/server/index.js; else echo 'missing server output' >&2; ls -la .output 2>/dev/null || true; exit 1; fi"]
