FROM node:18-slim

# Instalar dependencias de Puppeteer y Python
RUN apt-get update && apt-get install -y \
    chromium \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    wget \
    gconf-service \
    libasound2 \
    libcairo2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libxcb1 \
    libxext6 \
    libxi6 \
    libxrender1 \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Configurar Chromium para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copiar los archivos del proyecto
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY requirements.txt ./

# Instalar dependencias de Node.js y Python
RUN npm install
RUN pip3 install -r requirements.txt

# Copiar el código fuente
COPY . .

# Crear directorio dist/data
RUN mkdir -p dist/data


# Comando para ejecutar el bot
CMD ["npm", "start"] 