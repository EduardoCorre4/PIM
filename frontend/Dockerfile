# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Credenciais de demonstração exibidas na página inicial (somente ambiente local de apresentação).
ARG VITE_DEMO_GERENTE_EMAIL=
ARG VITE_DEMO_GERENTE_SENHA=
ARG VITE_DEMO_FUNCIONARIO_EMAIL=
ARG VITE_DEMO_FUNCIONARIO_SENHA=
RUN npm run build

# nginx "unprivileged": roda como usuário comum e escuta na porta 8080.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS final
ARG VERSION=dev
ARG REVISION=unknown
LABEL org.opencontainers.image.title="jake-web" \
      org.opencontainers.image.version="$VERSION" \
      org.opencontainers.image.revision="$REVISION"
ENV API_UPSTREAM=http://api:8080 \
    API_HOST_HEADER=\$host
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
