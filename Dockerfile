# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install git and python (needed for some npm packages)
RUN apk add --no-cache git python3 make g++

# Copy package files
COPY package.json ./

# Install dependencies with npm
RUN npm install

# Copy tsconfig
COPY tsconfig.json* ./

# Copy source code
COPY src ./src
COPY public ./public

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install git (needed for npm install)
RUN apk add --no-cache git

# Copy package files
COPY package.json ./

# Install production dependencies only with npm
RUN npm install --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Create sessions directory
RUN mkdir -p ./sessions

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
