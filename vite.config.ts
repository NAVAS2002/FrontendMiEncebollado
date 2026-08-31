import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Mi Encebollado — Mesero",
        short_name: "Mi Encebollado",
        description: "Toma de pedidos para meseros — Mi Encebollado",
        theme_color: "#ab3500",
        background_color: "#f8f9fa",
        display: "standalone",
        orientation: "portrait",
        start_url: "/mesero",
        scope: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Sin esto, un service worker nuevo se queda "esperando" hasta que
        // el mesero cierre la app del todo (no solo que la minimice) antes
        // de activarse — así, un cambio recién desplegado podía tardar
        // horas en llegarle a alguien que deja la PWA abierta todo el
        // turno. skipWaiting + clientsClaim lo activa apenas se instala.
        skipWaiting: true,
        clientsClaim: true,
        // La verdad siempre se lee por HTTP (regla del backend); el service
        // worker solo cachea el shell de la app para que abra sin red.
        navigateFallbackDenylist: [/^\/api/, /^\/ws/],
        runtimeCaching: [
          {
            urlPattern: /\/api\/v1\/catalog\/menu/,
            handler: "NetworkFirst",
            options: { cacheName: "menu-cache", networkTimeoutSeconds: 3 },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
  },
});
