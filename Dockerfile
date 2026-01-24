FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Create uploads directories
RUN mkdir -p uploads/audio uploads/images

EXPOSE 5000

CMD ["npm", "start"]