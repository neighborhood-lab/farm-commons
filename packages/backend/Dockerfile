# Multi-stage Dockerfile for Farm Commons Backend
# Optimized for fast builds and small image size

# Stage 1: Base dependencies
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install turbo globally
RUN npm install -g turbo

# Stage 2: Pruned monorepo for backend
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @farm-commons/backend --docker

# Stage 3: Install dependencies
FROM base AS installer
WORKDIR /app

# Copy pruned lockfile and package.json files
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies with cache mount for faster builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --prefer-offline

# Copy source code
COPY --from=pruner /app/out/full/ .

# Build the backend
RUN turbo run build --filter=@farm-commons/backend

# Stage 4: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 farmworker

# Copy necessary files from installer
COPY --from=installer --chown=farmworker:nodejs /app/packages/backend/dist ./dist
COPY --from=installer --chown=farmworker:nodejs /app/packages/backend/package.json ./package.json
COPY --from=installer --chown=farmworker:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=farmworker:nodejs /app/packages/shared/dist ../shared/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER farmworker

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
