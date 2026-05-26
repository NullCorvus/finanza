#!/bin/bash

# Exit on error
set -e

echo "🚀 Iniciando configuración del entorno..."

# 1. Backend Setup
echo "📦 Instalando dependencias del Backend (Python)..."
pip install fastapi uvicorn pydantic

echo "🗄️ Inicializando la base de datos SQLite..."
python3 backend/database.py

# 2. Frontend Setup
echo "📦 Instalando dependencias del Frontend (Node.js)..."
if [ -d "frontend" ]; then
    cd frontend
    npm install
    cd ..
else
    echo "⚠️ Directorio frontend no encontrado."
fi

echo "✅ Configuración completada con éxito."
echo "Para iniciar el proyecto:"
echo "1. Backend: uvicorn backend.main:app --reload"
echo "2. Frontend: cd frontend && npm run dev"
