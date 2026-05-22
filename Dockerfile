FROM node:20-slim

# Install python3 and ffmpeg (needed for yt-dlp to work perfectly)
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install dependencies including devDependencies so tsx/typescript build correctly
RUN npm install

# Copy all source files
COPY . .

# Build the Vite React frontend
RUN npm run build

# Expose port (Hugging Face uses 7860 by default)
EXPOSE 7860
ENV PORT=7860

# Start the Express server
CMD ["npm", "run", "start"]
