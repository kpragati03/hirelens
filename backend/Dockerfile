# HireLens backend — Docker image (alternative to Render's native Node deploy)
# Build:  docker build -t hirelens-backend ./backend
# Run:    docker run --env-file backend/.env -p 5000:5000 hirelens-backend
# The container listens on $PORT (default 5000) and exposes /api/health.
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy the rest of the backend source
COPY . .

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-5000}/api/health || exit 1

CMD ["node", "server.js"]
