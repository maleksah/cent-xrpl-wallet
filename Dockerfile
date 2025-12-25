# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run stage
FROM nginx:alpine
ENV PORT=8080
COPY --from=build /app/dist /usr/share/nginx/html
# Default Nginx config to listen on $PORT assigned by Cloud Run
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Replace $PORT in nginx config on startup
CMD ["sh", "-c", "sed -i \"s/\\$PORT/${PORT}/g\" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
