FROM node:18-alpine

# Workdir for backend
WORKDIR /app

# Install deps
COPY backend/package*.json ./
RUN npm install

# Copy backend source
COPY backend/ ./

# Default port
EXPOSE 3001

CMD ["npm", "start"]
