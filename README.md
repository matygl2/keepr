# Keepr

App móvil para guardar tus productos y no perderte ninguna garantía.

| Carpeta | Qué es | Tecnología |
|---|---|---|
| `keepr-back/` | API y base de datos | Express 5, Prisma 7, SQLite |
| `keepr-front/` | La app del celular | Expo SDK 58, Expo Router, Expo Go |

La app **necesita** que el backend esté corriendo: ahí se guardan las cuentas, los productos y las fotos de los documentos.

---

## Requisitos

- **Node.js 20.19 o superior** (o 22.12+ / 24+). Se comprueba con `node --version`.
- **Expo Go** instalado en el celular.
- El celular y la PC en **la misma red Wi-Fi**.

Todos los comandos de `keepr-back` se corren **dentro de la carpeta `keepr-back`** (ahí se crea el archivo de la base de datos). Los de la app, dentro de `keepr-front`.

---

## 1. Primera vez

Necesitás dos terminales: una para el backend y otra para la app. Primero va el backend.

### Backend

```bash
cd keepr-back
npm install
```

`npm install` también genera el cliente de Prisma solo (script `postinstall`).

**Crear el archivo `.env`.** Copiá el de ejemplo:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Abrí `.env` y completá `JWT_SECRET` con un valor de **al menos 32 caracteres**. Para generar uno:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Las otras dos líneas se dejan como están (`DATABASE_URL="file:./dev.db"` y `PORT=3000`).

**Crear la base de datos** aplicando las migraciones que ya están en el repositorio:

```bash
npm run db:deploy
```

Eso crea el archivo `dev.db` con todas las tablas. **No usar `db:migrate`**: ese comando solo se utiliza cuando cambia el esquema (ver sección 3).

**Arrancar el servidor:**

```bash
npm run dev
```

Debería mostrar algo así:

```
Keepr API listening on port 3000
  Local:      http://localhost:3000
  Android emu: http://10.0.2.2:3000
  Red local:  http://192.168.1.12:3000   <- usá esta en un celular real
```

Para comprobar que anda, abrí `http://localhost:3000/health` en el navegador: tiene que responder `{"status":"ok"}`.

### App

En la otra terminal:

```bash
cd keepr-front
npm install
```

**Decirle a la app dónde está el backend.** Creá el archivo `keepr-front/.env.local` con una sola línea:

```
EXPO_PUBLIC_API_URL=http://192.168.1.12:3000
```

Reemplazá la IP por la de **tu PC en la red Wi-Fi** (la línea "Red local" que mostró el servidor). Cuidado: si la PC tiene varias redes (VPN, WSL, VirtualBox), el servidor imprime una línea por cada una. La correcta es la IPv4 del adaptador **Wi-Fi**; en Windows la ves con `ipconfig`.

Si usás el **emulador de Android** en vez de un celular real, la dirección es `http://10.0.2.2:3000`.

**Arrancar la app:**

```bash
npx expo start -c
```

Después de crear o cambiar `.env.local` siempre hay que reiniciar Expo con `-c`, porque la variable se lee solo al iniciar.

---

## 2. Después de traer cambios (`git pull`)

Mirá qué archivos cambiaron y hacé lo que corresponda:

| Si cambió… | Hacé (en la carpeta indicada) |
|---|---|
| `keepr-back/package.json` o `package-lock.json` | `cd keepr-back` → `npm install` |
| `keepr-back/prisma/schema.prisma` o hay carpetas nuevas en `keepr-back/prisma/migrations/` | `cd keepr-back` → `npm run db:deploy` → `npm run db:generate` → **reiniciar el servidor** |
| `keepr-back/.env.example` | Revisá si hay variables nuevas y agregalas a tu `.env` |
| `keepr-front/package.json` o `package-lock.json` | `cd keepr-front` → `npm install` → `npx expo start -c` |

Si no sabés qué cambió, la rutina completa es segura y no borra datos:

```bash
cd keepr-back
npm install
npm run db:deploy
npm run db:generate
npm run dev
```

y en la otra terminal:

```bash
cd keepr-front
npm install
npx expo start -c
```

---

## 3. Si vos cambiás la base de datos

Cada vez que modifiques `keepr-back/prisma/schema.prisma` (una tabla, una columna):

1. Editá `schema.prisma`.
2. Creá y aplicá la migración, con un nombre corto que diga qué hace:

   ```bash
   cd keepr-back
   npm run db:migrate -- --name agregar_telefono_usuario
   ```

3. Regenerá el cliente:

   ```bash
   npm run db:generate
   ```

4. Reiniciá el servidor y corré las pruebas: `npm test`.
5. **Commiteá juntos** `schema.prisma` y la carpeta nueva que apareció en `prisma/migrations/`. Sin la carpeta de la migración, no se puede actualizar la base.

---

## 4. Empezar con una base de datos limpia

Si se quiere arrancar de cero (**esto borra todas las cuentas y productos de tu máquina**):

1. Frená el servidor.
2. Borrá `keepr-back/dev.db` (y, si querés borrar también las fotos, el contenido de `keepr-back/uploads/`).
3. Corré `npm run db:deploy` y volvé a arrancar con `npm run dev`.

---

## 5. Pruebas y chequeos

```bash
# Backend (dentro de keepr-back)
npm test            # usa una base temporal (test.db) que se crea y se borra sola
npm run typecheck

# App (dentro de keepr-front)
npx tsc --noEmit
```

Las pruebas del backend aplican las migraciones sobre `test.db`, así que también sirven para comprobar que tus migraciones funcionan. Si dicen que no hay migraciones, es que falta la carpeta `prisma/migrations`.

---

## 6. Problemas frecuentes

| Qué ves | Causa y solución |
|---|---|
| `Invalid .env configuration` al arrancar el backend | Falta el `.env` o `JWT_SECRET` tiene menos de 32 caracteres. |
| `PrismaClientValidationError: Unknown argument …` | Falta `npm run db:generate`. Corrélo y reiniciá el servidor. |
| `no such table` / `no such column` / `The column … does not exist` | La base no tiene las migraciones nuevas. Corré `npm run db:deploy`. |
| La app dice `The API address is not configured` | Falta `keepr-front/.env.local`, o no reiniciaste Expo con `npx expo start -c` después de crearlo. |
| La app dice `Cannot reach the server` o da timeout desde el celular | Revisá que el servidor esté corriendo, que el celular y la PC estén en la misma Wi-Fi, que la IP de `.env.local` sea la del adaptador Wi-Fi (no ZeroTier/VPN) y que el firewall de Windows permita a Node en redes privadas. |
| Cambiaste el `.env` del backend y no pasa nada | El servidor lee el `.env` solo al arrancar: reinicialo. |
| `npm install` falla con un error de versión de Node | Actualizá Node a 20.19 o superior. |