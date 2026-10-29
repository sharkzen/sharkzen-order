#!/bin/sh
# สำรองฐานข้อมูลเป็นไฟล์ pg_dump (custom format) แล้วลบไฟล์ที่เก่ากว่า BACKUP_KEEP_DAYS วัน
# ใช้ตัวแปร PG* มาตรฐานของ postgres (PGHOST PGUSER PGPASSWORD PGDATABASE) สั่งสำรองทันทีได้ด้วย:
#   docker compose --env-file ops/.env.staging -f docker-compose.staging.yml exec backup /bin/sh /backup.sh
set -eu
DIR="${BACKUP_DIR:-/backups}"
KEEP="${BACKUP_KEEP_DAYS:-14}"
mkdir -p "$DIR"
FILE="$DIR/sharkzen-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --format=custom --no-owner --file="$FILE.partial"
mv "$FILE.partial" "$FILE"
# ไฟล์เล็กผิดปกติ = สำรองล้มเหลว
if [ "$(wc -c < "$FILE")" -le 1024 ]; then
  echo "backup too small: $FILE" >&2
  rm -f "$FILE"
  exit 1
fi
find "$DIR" -name 'sharkzen-*.dump' -mtime +"$KEEP" -delete
echo "backup ok: $FILE ($(wc -c < "$FILE") bytes)"
