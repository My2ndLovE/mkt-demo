# Multi-stage build for NestJS backend

# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend

# Generate Prisma client
WORKDIR /app/apps/backend
RUN pnpm prisma:generate

# Build application
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma

# Set working directory to backend
WORKDIR /app/apps/backend

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start application
CMD ["node", "dist/main.js"]
