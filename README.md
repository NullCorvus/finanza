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
Ejecuta el script de configuración para instalar dependencias e inicializar la base de datos:
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Iniciar la Aplicación
Para arrancar tanto el backend como el frontend de forma simultánea, usa el script de inicio:
```bash
chmod +x start.sh
./start.sh
```
La aplicación estará disponible en `http://localhost:5173`. Presiona `Ctrl+C` en la terminal para detener ambos servidores.

## Funcionalidades Clave
- **Sincronización en tiempo real:** Los cambios en los sliders se reflejan instantáneamente en las métricas.
- **Persistencia:** Usa el botón "Guardar por Defecto" para que tus valores se mantengan en la próxima sesión.
- **Proyección de Postgrado:** Calcula la cuota mensual basada en la tasa del 14.56% E.A. y el salario proyectado.
- **Glosario:** Información detallada sobre términos del ICETEX integrada en la UI.
