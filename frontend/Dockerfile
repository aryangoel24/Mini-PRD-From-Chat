FROM node:22-alpine

WORKDIR /app

# Install deps first for caching
COPY frontend/package*.json ./
RUN npm install

# Copy source
COPY frontend ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]