# Google Cloud Run Dockerfile for LiveKit Agent
# Based on your existing Cloud Run setup pattern

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY livekit_agent.py .

# Create non-root user for security
RUN useradd -m -u 1000 agentuser && \
    chown -R agentuser:agentuser /app

USER agentuser

# Cloud Run expects the container to listen on PORT environment variable
# The agent includes a health check HTTP server that listens on this port
ENV PORT=8080

# Environment variables will be set by Cloud Run via --set-env-vars and --set-secrets
# Defaults are set here but will be overridden
ENV LIVEKIT_URL=wss://gemini-integration-pxcg6ngt.livekit.cloud
ENV GOOGLE_API_KEY=

# Run the LiveKit agent in dev mode
# Note: Cloud Run will keep this container running
CMD ["python", "livekit_agent.py", "dev"]
