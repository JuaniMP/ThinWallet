#!/bin/sh
set -e

echo ">>> Iniciando Tailscale daemon (userspace + SOCKS5)..."
tailscaled \
  --tun=userspace-networking \
  --socks5-server=localhost:1055 \
  --state=/tmp/tailscaled.state \
  --socket=/tmp/tailscaled.sock &

sleep 5

echo ">>> Conectando a la red Tailscale..."
tailscale --socket=/tmp/tailscaled.sock up \
  --authkey="${TS_AUTHKEY}" \
  --hostname="thinwallet-backend" \
  --accept-routes \
  --accept-dns=false

sleep 3

echo ">>> Estado de Tailscale:"
tailscale --socket=/tmp/tailscaled.sock status || true

echo ">>> Iniciando Spring Boot (SOCKS5 = localhost:1055)..."
exec java \
  -DsocksProxyHost=localhost \
  -DsocksProxyPort=1055 \
  "-DsocksNonProxyHosts=localhost|127.0.0.1|0.0.0.0" \
  -jar /app/app.jar \
  --server.address=0.0.0.0 \
  --server.port=8080
