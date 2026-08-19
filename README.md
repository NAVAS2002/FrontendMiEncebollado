# Mi Encebollado — Frontend

Interfaz web para el backend `resto-pos-api` de Mi Encebollado. React + TypeScript + Vite + Tailwind.

- **PWA para meseros** (`/mesero/*`): login con PIN, mapa de mesas, toma de pedidos con modificadores, pedidos para llevar. Instalable en el celular.
- **Sitio de caja y administración** (`/caja/*`): pedidos pendientes de pago, registro de cobros, apertura/cierre de caja, reportes del día y (solo ADMIN) gestión de usuarios y dispositivos.

## Arrancar

```bash
npm install
cp .env.example .env   # ajusta VITE_API_URL si el backend no corre en localhost:3000
npm run dev
```

Necesita el backend corriendo (ver `../Backend/README.md`) y con datos de semilla (`python -m app.cli.seed`):

```
admin   / admin1234
caja1   / caja1234   (PIN supervisor 2580)
mesero1 PIN 1234, mesero2 PIN 5678
```

## Emparejar un celular de mesero (una sola vez por dispositivo)

El login por PIN exige un dispositivo emparejado (lo pide el backend). Antes de que un mesero pueda entrar:

1. Entra como `admin` en **Caja y administración → Dispositivos**.
2. Genera un código con una etiqueta (ej. "Celular de María").
3. En el celular del mesero, abre **Acceso Mesero** → se le pedirá el código si el dispositivo no está emparejado — ingrésalo ahí.

Después de emparejado, el celular queda vinculado permanentemente (hasta que se revoque desde el panel de Dispositivos).

## Notas

- El WebSocket (`/ws`) mantiene todas las pantallas sincronizadas en tiempo real; el estado real siempre se confirma por HTTP.
- Los importes se manejan como texto decimal en toda la app (nunca `float`) para no arrastrar errores de redondeo del backend.
