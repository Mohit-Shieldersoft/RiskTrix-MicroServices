# Build stage for frontend
FROM node:18-alpine as frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build the app
RUN npm run build || true

# Runtime stage
FROM alpine:latest

RUN apk add --no-cache nginx

# Create nginx directories
RUN mkdir -p /usr/share/nginx/html /var/cache/nginx /var/log/nginx

# Copy built files from build stage
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'echo "Starting Nginx..."' >> /entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 8888

ENTRYPOINT ["/entrypoint.sh"]