# Multi-stage production build for DEPUTY
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@11.16.0

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json* ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/security/package.json ./packages/security/
COPY packages/synthesis/package.json ./packages/synthesis/
COPY packages/webmcp/package.json ./packages/webmcp/
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all monorepo packages and apps
RUN pnpm build

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0
ENV REPOSITORY_MODE=POSTGRES

# Create dedicated non-root user
RUN addgroup -S deputy && adduser -S deputy -G deputy

# Install curl for container health check
RUN apk add --no-cache curl

# Copy runtime files from builder
COPY --from=builder --chown=deputy:deputy /app ./

USER deputy

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "apps/server/dist/index.js"]
