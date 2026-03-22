# SOLVENTA SOFTWARE - Backend Ecosystem

Este es el backend oficial de **SOLVENTA SOFTWARE SPA**, diseñado con una arquitectura Deep Tech para la soberanía de datos y gemelos digitales.

## 🚀 Tecnologías

- **Runtime**: Node.js (v18+)
- **Lenguaje**: TypeScript
- **Framework Web**: Express.js
- **Base de Datos**: PostgreSQL (via Prisma ORM)
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Zod
- **Logs**: Winston & Morgan
- **Documentación**: Swagger/OpenAPI 3.0

## 📦 Estructura del Proyecto

```
backend/
├── prisma/             # Esquema de base de datos y migraciones
├── src/
│   ├── config/         # Configuraciones (Env, Database)
│   ├── controllers/    # Controladores de la API
│   ├── docs/           # Documentación Swagger
│   ├── middleware/      # Middlewares (Auth, Error Handler, RBAC)
│   ├── routes/         # Definición de rutas
│   ├── services/       # Lógica de negocio
│   ├── utils/          # Utilidades y Helpers
│   ├── app.ts          # Configuración de Express
│   └── index.ts        # Punto de entrada
├── tests/              # Tests automatizados
└── package.json        # Dependencias y scripts
```

## 🛠️ Instalación y Configuración

1. **Instalar dependencias:**
   ```bash
   cd backend
   npm install
   ```

2. **Configurar el entorno:**
   Copia el archivo `.env.example` a `.env` y configura tus variables:
   ```bash
   cp .env.example .env
   ```

3. **Base de Datos:**
   Asegúrate de tener PostgreSQL corriendo y ejecuta las migraciones:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

4. **Desarrollo:**
   ```bash
   npm run dev
   ```

## 📖 Documentación de la API

Una vez que el servidor esté corriendo, puedes acceder a la documentación interactiva en:
[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## 🔐 Roles y Permisos

El sistema utiliza RBAC (Role-Based Access Control):
- **SUPER_ADMIN**: Acceso total al ecosistema.
- **ADMIN**: Gestión de organización, usuarios y almacenes.
- **MANAGER**: Gestión de stock, órdenes y reportes.
- **OPERATOR**: Registro de movimientos y picking.
- **VIEWER**: Solo lectura.

---
© 2026 SOLVENTA SOFTWARE SPA
