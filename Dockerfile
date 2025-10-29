FROM node:18-alpine

# Install build dependencies for canvas
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy SSL certificate for Aiven PostgreSQL
# Make sure ca.pem is in the root directory
COPY ca.pem ./

# Copy application code
COPY . .

# Create cache directory for generated images
RUN mkdir -p cache

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV CACHE_DIR=/app/cache

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]
