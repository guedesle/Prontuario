import { createDecipheriv, createHash } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} é obrigatória.`);
  return value;
}

if (process.env.RESTORE_CONFIRM !== "RESTORE") {
  throw new Error("Defina RESTORE_CONFIRM=RESTORE para prosseguir.");
}
if (process.env.NODE_ENV === "production" && process.env.RESTORE_PRODUCTION_CONFIRM !== "RESTORE_PRODUCTION") {
  throw new Error("Produção exige RESTORE_PRODUCTION_CONFIRM=RESTORE_PRODUCTION.");
}

const backupFile = process.argv[2];
if (!backupFile) throw new Error("Uso: node scripts/restore-mysql.mjs <backup.sql.gz.enc>");
const manifest = JSON.parse(await fs.readFile(`${backupFile}.json`, "utf8"));
const encrypted = await fs.readFile(backupFile);
const sha256 = createHash("sha256").update(encrypted).digest("hex");
if (sha256 !== manifest.sha256) throw new Error("Checksum do backup não confere.");

const key = Buffer.from(required("BACKUP_ENCRYPTION_KEY_B64"), "base64");
if (key.length !== 32) throw new Error("BACKUP_ENCRYPTION_KEY_B64 deve decodificar 32 bytes.");
const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(manifest.ivB64, "base64"));
decipher.setAuthTag(Buffer.from(manifest.authTagB64, "base64"));

const url = new URL(required("DATABASE_URL"));
const args = [
  `--host=${url.hostname}`,
  `--port=${url.port || "3306"}`,
  `--user=${decodeURIComponent(url.username)}`,
  "--default-character-set=utf8mb4",
  url.pathname.replace(/^\//, ""),
];
const mysql = spawn(process.env.MYSQL_BIN ?? "mysql", args, {
  env: { ...process.env, MYSQL_PWD: decodeURIComponent(url.password) },
  stdio: ["pipe", "inherit", "inherit"],
});

const mysqlClosed = new Promise((resolveCode) => mysql.once("close", resolveCode));
await pipeline(createReadStream(backupFile), decipher, createGunzip(), mysql.stdin);
const exitCode = await mysqlClosed;
if (exitCode !== 0) throw new Error(`mysql terminou com código ${exitCode}.`);
console.log("Restauração concluída. Execute os testes de integridade antes de liberar o sistema.");
