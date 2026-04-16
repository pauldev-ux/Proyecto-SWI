# Sistema de Gestión de Políticas de Negocio

Aplicación desarrollada con:
- **Frontend**: Angular 17
- **Backend**: Python/FastAPI
- **Base de datos**: MongoDB

## Estructura del Proyecto

### Backend (`/backend`)

```
backend/
├── app/
│   ├── core/          # Configuración de la aplicación
│   ├── database/      # Conexión a MongoDB
│   ├── models/        # Modelos de datos
│   ├── schemas/       # Esquemas Pydantic para validación
│   ├── services/      # Lógica de negocio
│   └── routes/        # Endpoints de la API
├── requirements.txt   # Dependencias Python
├── .env.example      # Archivo de ejemplo de variables de entorno
└── main.py           # Punto de entrada de la aplicación
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/          # Guards e Interceptors
│   │   ├── services/      # Servicios Angular
│   │   ├── models/        # Interfaces y modelos
│   │   ├── pages/         # Componentes de página (Lazy loaded)
│   │   ├── components/    # Componentes compartidos
│   │   ├── app.module.ts  # Módulo raíz
│   │   ├── app-routing.module.ts
│   │   ├── app.component.*
│   │   └── ...
│   ├── assets/        # Recursos estáticos
│   ├── styles.css     # Estilos globales
│   ├── main.ts        # Punto de entrada
│   ├── index.html
│   └── ...
├── package.json
├── angular.json
└── tsconfig.json
```

## Instalación

### Backend

1. Instalar dependencias:
```bash
cd backend
pip install -r requirements.txt
```

2. Crear archivo `.env`:
```bash
cp .env.example .env
```

3. Configurar MongoDB (asegurar que esté corriendo en `mongodb://localhost:27017`)

4. Ejecutar servidor:
```bash
python -m uvicorn main:app --reload
```

La API estará disponible en `http://localhost:8000`
Documentación interactiva en `http://localhost:8000/docs`

### Frontend

1. Instalar dependencias:
```bash
cd frontend
npm install
```

2. Ejecutar servidor de desarrollo:
```bash
ng serve
```

La aplicación estará disponible en `http://localhost:4200`

## Características Principales

### Gestión de Políticas de Negocio
- Crear políticas de negocio con diagramas de actividades
- Soporte para diferentes tipos de flujos (lineal, alternativo, iterativo, paralelo)
- Colaboración entre usuarios
- Control de versiones

### Gestión de Trámites
- Registro de nuevos trámites
- Seguimiento del estado en tiempo real
- Historial de actividades
- Asignación de tareas a funcionarios

### Monitor de Funcionarios
- Panel para visualizar tareas asignadas
- Actualización en tiempo real (sin necesidad de recargar)
- Completar tareas con formularios dinámicos
- Notificaciones de nuevas tareas

### Análisis y Métricas
- Identificar cuellos de botella
- Tiempo de atención por actividad
- KPIs y estadísticas

## Endpoints Principales

### Usuarios
- `POST /api/v1/usuarios/registro` - Registrar nuevo usuario
- `POST /api/v1/usuarios/login` - Iniciar sesión
- `GET /api/v1/usuarios` - Listar usuarios
- `GET /api/v1/usuarios/{usuario_id}` - Obtener usuario

### Políticas de Negocio
- `POST /api/v1/politicas` - Crear política
- `GET /api/v1/politicas` - Listar políticas
- `GET /api/v1/politicas/{politica_id}` - Obtener política
- `PUT /api/v1/politicas/{politica_id}` - Actualizar política
- `DELETE /api/v1/politicas/{politica_id}` - Eliminar política

### Trámites
- `POST /api/v1/tramites` - Crear trámite
- `GET /api/v1/tramites/{tramite_id}` - Obtener trámite
- `GET /api/v1/tramites/politica/{politica_id}` - Trámites por política
- `GET /api/v1/tramites/cliente/{cliente_email}` - Trámites por cliente

## Próximas Características

- Integración con IA para diseño colaborativo de políticas
- Reconocimiento de voz para formularios
- Detección automática de cuellos de botella con IA
- WebSockets para actualización en tiempo real
- Editor visual de diagramas con arrastrar y soltar

## Licencia

MIT
