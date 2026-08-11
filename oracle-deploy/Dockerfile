# Starsector Webswing Docker Image
# For Oracle Cloud ARM64 (Ampere) - Free Tier

FROM arm64v8/eclipse-temurin:17-jdk-jammy

# Install required packages
RUN apt-get update && apt-get install -y \
    xvfb \
    libxext6 \
    libxi6 \
    libxtst6 \
    libxrender1 \
    libpangoft2-1.0-0 \
    libasound2 \
    libgl1-mesa-glx \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create directories
WORKDIR /opt
RUN mkdir -p /opt/starsector /opt/webswing

# Download Webswing
ARG WEBSWING_VERSION=24.2.2
RUN wget -q https://www.webswing.org/files/public/webswing-${WEBSWING_VERSION}-distribution.zip \
    && unzip webswing-${WEBSWING_VERSION}-distribution.zip \
    && mv webswing-${WEBSWING_VERSION} /opt/webswing/webswing \
    && rm webswing-${WEBSWING_VERSION}-distribution.zip

# Copy Starsector game files (you'll mount these via volume)
# The game will be at /opt/starsector

# Copy Webswing configuration
COPY webswing.config /opt/webswing/webswing/webswing.config

# Expose port
EXPOSE 8080

# Set display for headless rendering
ENV DISPLAY=:99

# Start Xvfb and Webswing
CMD Xvfb :99 -screen 0 1920x1080x24 & \
    sleep 2 && \
    cd /opt/webswing/webswing && \
    ./webswing.sh run
