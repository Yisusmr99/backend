# Backend - Desarrollo Web

Este proyecto es un backend construido con Node.js, Express, TypeScript y TypeORM, usando MySQL como base de datos. Incluye autenticación, middlewares, controladores, servicios y utilidades para facilitar el desarrollo de nuevas features.

## Requisitos

- Node.js >= 18.x
- npm >= 9.x
- MySQL >= 8.x

## Instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/Yisusmr99/backend.git
   cd backend
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   - Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
     ```env
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=tu_usuario
     DB_PASS=tu_contraseña
     DB_NAME=nombre_base_de_datos
     JWT_SECRET=tu_secreto
     ```

4. **Configura la base de datos:**
   - Asegúrate de tener una base de datos MySQL corriendo y accesible con los datos del `.env`.

## Scripts útiles

- `npm run dev` — Levanta el servidor en modo desarrollo con recarga automática.
- `npm run build` — Compila el proyecto a JavaScript en la carpeta `dist`.
- `npm start` — Ejecuta el servidor en modo producción (requiere compilar primero).
- `npm run worker` — Inicia el worker para tareas en segundo plano (RabbitMQ).

## Estructura del proyecto

```
src/
  index.ts            # Entry point principal
  worker.ts           # Worker para tareas asíncronas
  config/             # Configuración (DB, etc)
  controllers/        # Controladores de rutas
  dtos/               # Data Transfer Objects
  middlewares/        # Middlewares de Express
  models/             # Entidades de TypeORM
  routes/             # Definición de rutas
  services/           # Lógica de negocio
  utils/              # Utilidades generales
```

## Cómo colaborar

1. Crea una rama a partir de `development`:
   ```bash
   git checkout -b feature/mi-nueva-feature
   ```
2. Realiza tus cambios y asegúrate de seguir la estructura del proyecto.
3. Haz commits claros y descriptivos.
4. Sube tu rama y crea un Pull Request.

## Notas
- Usa TypeScript y sigue las buenas prácticas del proyecto.
- Si agregas nuevas dependencias, actualiza este README si es necesario.
- Si tienes dudas, revisa los archivos de ejemplo en cada carpeta.

---

¡Gracias por contribuir!
