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

### 1. Configuración Automática
Hemos incluido un script para configurar todo el entorno de una vez:
```bash
chmod +x setup.sh
./setup.sh
```
Este script instalará las dependencias de Python, inicializará la base de datos e instalará los paquetes de Node.js.

### 2. Ejecutar el Proyecto
Necesitarás dos terminales abiertas:

**Terminal 1 (Backend):**
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

## Funcionalidades Clave
- **Sincronización en tiempo real:** Los cambios en los sliders se reflejan instantáneamente en las métricas.
- **Persistencia:** Usa el botón "Guardar por Defecto" para que tus valores se mantengan en la próxima sesión.
- **Proyección de Postgrado:** Calcula la cuota mensual basada en la tasa del 14.56% E.A. y el salario proyectado.
- **Glosario:** Información detallada sobre términos del ICETEX integrada en la UI.
