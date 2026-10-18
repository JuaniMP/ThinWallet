#!/usr/bin/env bash
# Crea desde cero las bases de datos de ThinWallet (MySQL + MongoDB).
#
# Uso:
#   ./database/setup.sh                      # usa root sin contraseña en localhost
#   MYSQL_USER=tw MYSQL_PWD=secreto ./database/setup.sh
#
# Variables opcionales:
#   MYSQL_HOST (127.0.0.1)  MYSQL_PORT (3306)  MYSQL_USER (root)  MYSQL_PWD ("")
#   DB_NAME (thinwallet_db) MONGODB_URI (mongodb://localhost:27017)
#   RESET=1  -> borra la base MySQL antes de crearla
set -euo pipefail
cd "$(dirname "$0")"

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-root}"
export MYSQL_PWD="${MYSQL_PWD:-}"
DB_NAME="${DB_NAME:-thinwallet_db}"
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017}"

mysql_cmd() { mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" "$@"; }

if [ "${RESET:-0}" = "1" ]; then
  echo "→ Eliminando $DB_NAME"
  mysql_cmd -e "DROP DATABASE IF EXISTS \`$DB_NAME\`"
fi

echo "→ Creando base MySQL $DB_NAME"
mysql_cmd -e "CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

for script in mysql/0*.sql; do
  echo "  · $script"
  mysql_cmd "$DB_NAME" < "$script"
done

echo "→ Inicializando MongoDB ($MONGODB_URI/$DB_NAME)"
mongosh --quiet "$MONGODB_URI/$DB_NAME" --file mongodb/auditoria_init.js >/dev/null

echo "✓ Bases de datos listas"
