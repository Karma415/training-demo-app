# --- Build Stage ---
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies cleanly
RUN npm ci

# Copy full source and build
COPY . .
RUN npm run build

# --- Production Stage ---
FROM nginx:alpine

# Copy the tailored NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React assets from the Build Stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose Cloud Run's required port (8080)
EXPOSE 8080

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
