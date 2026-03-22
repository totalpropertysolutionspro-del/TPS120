FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm install

# Build backend
COPY backend ./backend
RUN npm run build --workspace=backend

# Build frontend
COPY frontend ./frontend
RUN npm run build --workspace=frontend

# Copy built files
RUN mkdir -p /app/dist/backend
RUN cp -r /app/backend/dist/* /app/dist/backend/

EXPOSE 5000 3000

CMD ["npm", "run", "dev"]
