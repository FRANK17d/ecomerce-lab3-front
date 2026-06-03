# Stride District — Frontend

> Proyecto mantenido con [GitNexus](https://gitnexus.dev)

Tienda online **Stride District** construida con Next.js 16, React 19 y Tailwind CSS 4. Incluye catalogo de productos, autenticacion, carrito de compras, historial de pedidos y panel de administracion.

## Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19
- **Estilos:** Tailwind CSS 4 + CSS custom properties
- **Tipado:** TypeScript 5
- **Imagenes:** next/image con dominio CDN dummyjson

## Inicio rapido (local)

```bash
# 1. Clonar e instalar
git clone <repo-url> && cd front
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local

# 3. Iniciar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Variables de entorno

| Variable | Descripcion | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend Express | `http://localhost:4000` |

## Rutas

| Ruta | Descripcion | Proteccion |
|---|---|---|
| `/` | Catalogo de productos (storefront) | Publica |
| `/auth` | Login y registro | Publica |
| `/account` | Perfil y resumen de cuenta | Requiere sesion |
| `/cart` | Bolsa de compra | Requiere sesion |
| `/orders` | Historial de pedidos | Requiere sesion |
| `/admin` | Panel de administracion | Requiere rol admin |

## Arquitectura

```
app/
├── components/      # Componentes de pagina (storefront, cart, admin, etc.)
├── lib/
│   ├── api.ts       # Cliente HTTP centralizado (apiFetch)
│   ├── auth-context.tsx  # Contexto de autenticacion global
│   ├── toast-context.tsx # Sistema de notificaciones
│   └── types.ts     # Tipos TypeScript compartidos
├── layout.tsx       # Layout raiz con providers
└── [rutas]/page.tsx # Paginas de la aplicacion
```

## Despliegue en Vercel (CLI)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Vincular proyecto (desde la carpeta front/)
vercel link

# 4. Configurar variable de entorno
vercel env add NEXT_PUBLIC_API_URL
# Ingresa la URL del backend en Heroku: https://ecommerce-lab3-back-fcg-xxxxx.herokuapp.com

# 5. Desplegar a produccion
vercel --prod

# 6. Copiar la URL generada y actualizar CORS en Heroku
heroku config:set CLIENT_URL=https://tu-proyecto.vercel.app --app ecommerce-lab3-back-fcg
```

## Scripts disponibles

| Script | Descripcion |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de produccion |
| `npm start` | Servidor produccion local |
| `npm run lint` | Linter ESLint |

## Diseno responsive

La aplicacion esta optimizada para todos los tamaños de pantalla:
- **Mobile** (< 640px): navegacion vertical, grid de 1 columna, toasts full-width
- **Tablet** (640-1024px): grid de 2 columnas, navegacion horizontal
- **Desktop** (> 1024px): grid de 3-4 columnas, sidebar sticky en carrito

## Licencia

ISC
