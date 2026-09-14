FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias del sistema esenciales
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del proyecto
COPY . .

# Exponer el puerto
EXPOSE 8000

# Comando para iniciar la aplicación (sobreescrito en docker-compose para dev)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
