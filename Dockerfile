# ==========================================================
# STAGE 1: Build the Vite React Application
# ==========================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package lists for installing dependencies
COPY package*.json ./

# Install packages clean and fast
RUN npm ci

# Copy the rest of the application files
COPY . .

# NOTE: If you ever add environment variables that Vite needs to embed at build-time (prefixed with VITE_),
# you can declare them here using ARG and ENV.
# Example:
# ARG VITE_API_URL
# ENV VITE_API_URL=$VITE_API_URL

# Build the application (output will be in the 'dist' directory)
RUN npm run build

# ==========================================================
# STAGE 2: Serve the Application using Nginx
# ==========================================================
FROM nginx:1.25-alpine

# Remove default nginx website config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration (handles SPA routing fallbacks)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from Stage 1 to Nginx public folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for EasyPanel
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
