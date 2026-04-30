# Build stage for frontend
FROM node:18-alpine as frontend-build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache nginx

COPY --from=frontend-build /app/dist /app/public

COPY . /app/

RUN cd /app && npm ci --only=production

COPY nginx.conf /etc/nginx/http.d/default.conf

RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'nginx' >> /app/start.sh && \
    echo 'cd /app && node server/server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 8888

CMD ["/app/start.sh"]