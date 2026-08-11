# Google Cloud Run Dockerfile for Stellar AI Backend Server
FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p stellar-ai-data/chats stellar-ai-data/images

# Create non-root user for security
# Check if user 1000 exists, if not create it
RUN if ! id -u 1000 > /dev/null 2>&1; then \
        useradd -m -u 1000 appuser; \
    fi && \
    chown -R 1000:1000 /app

USER 1000

# Cloud Run expects the container to listen on PORT environment variable
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "stellar-ai-server.js"]
