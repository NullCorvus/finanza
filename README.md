# Simulador de Ingresos y Gastos Crédito ICETEX 30%

Este es un simulador avanzado para estudiantes con crédito ICETEX (modalidad 30%), diseñado para proyectar finanzas durante el semestre y la etapa de postgrado.

## Requisitos
- Python 3.10+
- Node.js 18+
- npm o yarn

## Estructura del Proyecto
- `/backend`: Servidor FastAPI y base de datos SQLite.
- `/frontend`: SPA moderna con React, Vite y Tailwind CSS.

## Instrucciones de Ejecución

### 1. Configurar y Ejecutar el Backend
Desde la raíz del proyecto:
```bash
# Instalar dependencias
pip install fastapi uvicorn pydantic

# Inicializar la base de datos (solo la primera vez)
python backend/database.py

# Iniciar el servidor
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
El backend estará disponible en `http://localhost:8000`.

### 2. Configurar y Ejecutar el Frontend
Abre una nueva terminal y desde la raíz del proyecto:
```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```
El frontend estará disponible en `http://localhost:5173`.

## Funcionalidades Clave
- **Sincronización en tiempo real:** Los cambios en los sliders se reflejan instantáneamente en las métricas.
- **Persistencia:** Usa el botón "Guardar por Defecto" para que tus valores se mantengan en la próxima sesión.
- **Proyección de Postgrado:** Calcula la cuota mensual basada en la tasa del 14.56% E.A. y el salario proyectado.
- **Glosario:** Información detallada sobre términos del ICETEX integrada en la UI.
