# Multi-stage Dockerfile for Farm Commons Frontend
# Optimized for fast builds and small image size

# Stage 1: Base dependencies
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install turbo globally
RUN npm install -g turbo

# Stage 2: Pruned monorepo for frontend
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @farm-commons/frontend --docker

# Stage 3: Install dependencies and build
FROM base AS builder
WORKDIR /app

# Copy pruned lockfile and package.json files
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies with cache mount for faster builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# Copy source code
COPY --from=pruner /app/out/full/ .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_APP_VERSION

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Build the frontend
RUN turbo run build --filter=@farm-commons/frontend

# Stage 4: Production runner with nginx
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy nginx configuration
COPY packages/frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built files from builder
COPY --from=builder /app/packages/frontend/dist .

# Create non-root user for security
RUN addgroup --system --gid 1001 nginx-user && \
    adduser --system --uid 1001 nginx-user && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

USER nginx-user

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
