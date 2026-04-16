# Guía Rápida de inicio del Proyecto

## Requisitos Previos

- Python 3.8+
- Node.js 18+
- MongoDB 4.4+
- Git

## Opción 1: Instalación Manual

### 1. Clonar el repositorio
```bash
git clone <tu-repo>
cd SW1
```

### 2. Instalar y ejecutar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env
cp .env.example .env

# Ejecutar servidor
python -m uvicorn main:app --reload
```

Backend estará disponible en `http://localhost:8000`

### 3. Instalar y ejecutar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
ng serve

# O si prefieres:
npm start
```

Frontend estará disponible en `http://localhost:4200`

---

## Opción 2: Con Docker

### Requisitos
- Docker
- Docker Compose

### Pasos

1. Desde la raíz del proyecto, ejecutar:
```bash
docker-compose up -d
```

Esto iniciará MongoDB automáticamente.

2. Para el backend:
```bash
cd backend
docker build -t politicas-backend .
docker run -p 8000:8000 --network politicas_network politicas-backend
```

3. Para el frontend:
```bash
cd frontend
docker build -t politicas-frontend .
docker run -p 4200:4200 politicas-frontend
```

---

## Configuración de la Base de Datos

MongoDB debe estar corriendo en `mongodb://localhost:27017`

Para verificar la conexión, accede a:
- MongoDB Compass: `mongodb://localhost:27017`

---

## Primeros pasos

1. Abre `http://localhost:4200` en tu navegador
2. Register un nuevo usuario o lo con credenciales de prueba
3. Comienza a crear políticas de negocio

---

## API Documentación

Ve a `http://localhost:8000/docs` para ver la documentación interactiva de FastAPI (Swagger)

---

## Monitoreo y Contraseña del Usuario Admin

Si quieres crear un usuario admin manualmente en la base de datos:

```javascript
db.usuarios.insertOne({
  email: "admin@test.com",
  nombre: "Admin Usuario",
  contraseña_hash: "$2b$12$...", // hash de "password123"
  rol: "admin",
  departamento: null,
  activo: true,
  fecha_creacion: new Date(),
  ultimo_login: null
})
```

---

## Solución de Problemas

### Puerto 8000 en uso
```bash
# Cambiar puerto en main.py o:
python -m uvicorn main:app --port 8001 --reload
```

### Puerto 4200 en uso
```bash
ng serve --port 4201
```

### MongoDB no conecta
- Asegúrate que MongoDB esté corriendo
- Verificar la URL en `.env/backend/app/core/config.py`

### Error de CORS
- Verificar que `frontend` esté en la lista de `origins` en `backend/main.py`

---

## Estructura de Carpetas

```
SW1/
├── backend/              # API FastAPI
│   ├── app/
│   │   ├── core/        # Configuración
│   │   ├── database/    # Conexión DB
│   │   ├── models/      # Modelos de datos
│   │   ├── schemas/     # Validación
│   │   ├── services/    # Lógica de negocios
│   │   └── routes/      # Endpoints
│   ├── main.py          # Entrada
│   └── requirements.txt
│
├── frontend/            # Aplicación Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # Guards, Interceptors
│   │   │   ├── services/    # Servicios
│   │   │   ├── models/      # Interfaces
│   │   │   ├── pages/       # Componentes raíz
│   │   │   └── components/  # Componentes compartidos
│   │   ├── main.ts
│   │   └── index.html
│   ├── package.json
│   └── angular.json
│
├── docker-compose.yml   # Configuración Docker
└── README.md            # Documentación
```

---

## Credenciales de Prueba (después de registrarse)

- Email: `usuario@test.com`
- Password: `password123`
- Rol: `funcionario`

---

## Próximos pasos

1. Completar el módulo de editor de diagrama con arrastrar y soltar
2. Integrar WebSockets para actualización en tiempo real
3. Agregar generación de formularios dinámicos
4. Integrar IA para análisis de cuellos de botella
5. Implementar reconocimiento de voz

---

¡Listo para comenzar! 🚀
