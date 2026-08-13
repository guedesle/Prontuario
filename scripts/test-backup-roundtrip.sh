#!/usr/bin/env bash
set -euo pipefail
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cat > "$TMP/fake-mysqldump" <<'SH'
#!/usr/bin/env bash
printf '%s\n' 'CREATE TABLE synthetic_test (id INT);' 'INSERT INTO synthetic_test VALUES (1);'
SH
chmod +x "$TMP/fake-mysqldump"

cat > "$TMP/fake-mysql" <<SH
#!/usr/bin/env bash
cat > "$TMP/restored.sql"
SH
chmod +x "$TMP/fake-mysql"

KEY="$(node -e 'process.stdout.write(Buffer.alloc(32, 9).toString("base64"))')"
export DATABASE_URL='mysql://user:password@localhost:3306/prontuario_test'
export BACKUP_ENCRYPTION_KEY_B64="$KEY"
export BACKUP_DIR="$TMP/backups"
export MYSQLDUMP_BIN="$TMP/fake-mysqldump"
BACKUP_FILE="$(node scripts/backup-mysql.mjs)"

test -f "$BACKUP_FILE"
test -f "$BACKUP_FILE.json"
export MYSQL_BIN="$TMP/fake-mysql"
export RESTORE_CONFIRM=RESTORE
node scripts/restore-mysql.mjs "$BACKUP_FILE" >/dev/null

grep -q 'CREATE TABLE synthetic_test' "$TMP/restored.sql"
grep -q 'INSERT INTO synthetic_test VALUES (1)' "$TMP/restored.sql"
echo 'Backup/restore encrypted roundtrip: OK'
