FROM node:20-alpine as build

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN yarn install

# Build the application
RUN yarn build

# Production stage with nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
