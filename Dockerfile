# Frontend de Mi Encebollado: se compila una vez y lo sirve nginx, que además
# reenvía /api, /ws y /health al backend. Como la app y la API salen por el
# MISMO origen, la PWA no necesita saber ninguna IP: se puede mover el equipo
# a otra red sin recompilar nada.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Base relativa => mismo origen (ver src/api/client.ts). Una variable de
# entorno real gana sobre cualquier .env, así que aunque .dockerignore ya
# deja fuera los .env, esto garantiza que no se cuelen URLs de otro entorno.
ENV VITE_API_URL=/api/v1
ENV VITE_WS_URL=
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Guía para instalar el certificado en los celulares (solo existe en este despliegue).
COPY deploy/instalar.html /usr/share/nginx/html/instalar.html
EXPOSE 80
