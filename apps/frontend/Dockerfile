# Multi-stage build for React Router 7 frontend

# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/frontend ./apps/frontend

# Build application
WORKDIR /app/apps/frontend
RUN pnpm build

# Stage 2: Production with Nginx
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=builder /app/apps/frontend/build/client /usr/share/nginx/html

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
