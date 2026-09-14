FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias e instalar
COPY package*.json ./
RUN npm install

# Copiar el resto de archivos del proyecto
COPY . .

# Exponer puerto de desarrollo de Vite
EXPOSE 5173

# Iniciar servidor de desarrollo
CMD ["npm", "run", "dev"]
