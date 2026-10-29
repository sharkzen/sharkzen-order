#!/bin/sh
# กู้ฐานข้อมูลจากไฟล์สำรอง (ลบข้อมูลปัจจุบันในฐานข้อมูลนั้นทั้งหมด) ควรหยุด backend ก่อนแล้วเปิดใหม่หลังกู้เสร็จ
#   docker compose --env-file ops/.env.staging -f docker-compose.staging.yml stop backend
#   docker compose --env-file ops/.env.staging -f docker-compose.staging.yml exec backup /bin/sh /restore.sh /backups/sharkzen-XXXX.dump
#   docker compose --env-file ops/.env.staging -f docker-compose.staging.yml start backend
set -eu
FILE="${1:?ระบุไฟล์ .dump}"
[ -f "$FILE" ] || { echo "ไม่พบไฟล์ $FILE" >&2; exit 1; }
pg_restore --clean --if-exists --no-owner --dbname="$PGDATABASE" "$FILE"
echo "restore ok: $FILE"
