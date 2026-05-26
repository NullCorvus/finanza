#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Deteniendo servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit
}

trap cleanup INT TERM

echo "📡 Iniciando Backend (FastAPI) en el puerto 8000..."
uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "💻 Iniciando Frontend (Vite) en el puerto 5173..."
cd frontend
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

echo ""
echo "🚀 ¡Todo listo!"
echo "- Backend: http://localhost:8000"
echo "- Frontend: http://localhost:5173"
echo ""
echo "Presiona Ctrl+C para detener ambos servidores."

# Wait for processes to keep the script running
wait
