#!/usr/bin/env bash
# =============================================================================
# RNF-11 — ThinWallet backup automatizado (MySQL + MongoDB)
#
# Uso interactivo:
#   ./scripts/backup.sh
#
# Uso con cron (diario a las 03:00 hora local):
#   crontab -e
#   0 3 * * *  /ruta/absoluta/al/repo/scripts/backup.sh >> /var/log/thinwallet-backup.log 2>&1
#
# Variables de entorno (cargadas desde scripts/backup.env si existe):
#   MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB
#   MONGO_URI, MONGO_DB
#   BACKUP_DIR        (default: ./backups)
#   BACKUP_RETENTION  (días que se conservan, default: 14)
#
# Dependencias:
#   * mysqldump (mysql-client) en PATH
#   * mongodump (mongodb-database-tools) en PATH
#   * gzip
# =============================================================================

set -euo pipefail

# ── Localización del script y carga de configuración ─────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/backup.env"

if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a
    source "$ENV_FILE"
    set +a
fi

# ── Defaults ─────────────────────────────────────────────────────────────────
MYSQL_HOST="${MYSQL_HOST:-100.87.26.105}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-ThinWallet}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"
MYSQL_DB="${MYSQL_DB:-thinwallet_db}"

MONGO_URI="${MONGO_URI:-}"
MONGO_DB="${MONGO_DB:-gestion_gastos_audit}"

BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/../backups}"
BACKUP_RETENTION="${BACKUP_RETENTION:-14}"

TIMESTAMP="$(date +'%Y-%m-%d_%H%M%S')"
DATE_ONLY="$(date +'%Y-%m-%d')"

# ── Helpers ──────────────────────────────────────────────────────────────────
log()  { echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"; }
fail() { log "ERROR: $*"; exit 1; }

require() {
    command -v "$1" >/dev/null 2>&1 || fail "$1 no encontrado en PATH"
}

# ── Pre-checks ───────────────────────────────────────────────────────────────
require mysqldump
require gzip

mkdir -p "$BACKUP_DIR/mysql" "$BACKUP_DIR/mongo"

# ── MySQL ────────────────────────────────────────────────────────────────────
log "Iniciando dump MySQL $MYSQL_DB@$MYSQL_HOST"
MYSQL_OUT="$BACKUP_DIR/mysql/${MYSQL_DB}_${TIMESTAMP}.sql.gz"

if [[ -z "$MYSQL_PASSWORD" ]]; then
    log "WARN: MYSQL_PASSWORD vacío — usando .my.cnf si existe"
    mysqldump \
        --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER" \
        --single-transaction --quick --routines --triggers --events \
        --default-character-set=utf8mb4 \
        "$MYSQL_DB" \
        | gzip -c > "$MYSQL_OUT"
else
    MYSQL_PWD="$MYSQL_PASSWORD" mysqldump \
        --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER" \
        --single-transaction --quick --routines --triggers --events \
        --default-character-set=utf8mb4 \
        "$MYSQL_DB" \
        | gzip -c > "$MYSQL_OUT"
fi
log "MySQL backup OK: $MYSQL_OUT ($(du -h "$MYSQL_OUT" | cut -f1))"

# ── MongoDB ──────────────────────────────────────────────────────────────────
if command -v mongodump >/dev/null 2>&1; then
    if [[ -n "$MONGO_URI" ]]; then
        log "Iniciando dump MongoDB $MONGO_DB"
        MONGO_OUT_DIR="$BACKUP_DIR/mongo/${MONGO_DB}_${TIMESTAMP}"
        mongodump --uri="$MONGO_URI" --db="$MONGO_DB" --out="$MONGO_OUT_DIR" --quiet
        ( cd "$BACKUP_DIR/mongo" && tar -czf "${MONGO_DB}_${TIMESTAMP}.tar.gz" "${MONGO_DB}_${TIMESTAMP}" )
        rm -rf "$MONGO_OUT_DIR"
        log "MongoDB backup OK: ${MONGO_OUT_DIR}.tar.gz"
    else
        log "MONGO_URI no definido — se omite backup MongoDB"
    fi
else
    log "WARN: mongodump no instalado — se omite backup MongoDB"
fi

# ── Retención ────────────────────────────────────────────────────────────────
log "Aplicando política de retención: $BACKUP_RETENTION días"
find "$BACKUP_DIR/mysql" -type f -name '*.sql.gz' -mtime "+$BACKUP_RETENTION" -print -delete || true
find "$BACKUP_DIR/mongo" -type f -name '*.tar.gz' -mtime "+$BACKUP_RETENTION" -print -delete || true

# ── Resumen ──────────────────────────────────────────────────────────────────
log "Backup $DATE_ONLY completado."
log "Espacio total backups: $(du -sh "$BACKUP_DIR" | cut -f1)"
