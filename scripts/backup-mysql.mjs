import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { createWriteStream, promises as fs } from "node:fs";
import { mkdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} é obrigatória.`);
  return value;
}

const url = new URL(required("DATABASE_URL"));
if (url.protocol !== "mysql:") throw new Error("DATABASE_URL deve usar mysql://");
const key = Buffer.from(required("BACKUP_ENCRYPTION_KEY_B64"), "base64");
if (key.length !== 32) throw new Error("BACKUP_ENCRYPTION_KEY_B64 deve decodificar 32 bytes.");

const backupDir = resolve(process.env.BACKUP_DIR ?? "./backups");
await mkdir(backupDir, { recursive: true, mode: 0o700 });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = join(backupDir, `prontuario-${stamp}.sql.gz.enc`);
const manifestFile = `${file}.json`;
const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const gzip = createGzip({ level: 9 });

const args = [
  `--host=${url.hostname}`,
  `--port=${url.port || "3306"}`,
  `--user=${decodeURIComponent(url.username)}`,
  "--single-transaction",
  "--quick",
  "--routines",
  "--triggers",
  "--events",
  "--default-character-set=utf8mb4",
  url.pathname.replace(/^\//, ""),
];

const dump = spawn(process.env.MYSQLDUMP_BIN ?? "mysqldump", args, {
  env: { ...process.env, MYSQL_PWD: decodeURIComponent(url.password) },
  stdio: ["ignore", "pipe", "inherit"],
});

const output = createWriteStream(file, { mode: 0o600 });
const dumpClosed = new Promise((resolveCode) => dump.once("close", resolveCode));
await pipeline(dump.stdout, gzip, cipher, output);
const exitCode = await dumpClosed;
if (exitCode !== 0) {
  await fs.rm(file, { force: true });
  throw new Error(`mysqldump terminou com código ${exitCode}.`);
}

const authTag = cipher.getAuthTag();
const encrypted = await fs.readFile(file);
const sha256 = createHash("sha256").update(encrypted).digest("hex");
const manifest = {
  format: "prontuario-mysql-backup-v1",
  file: basename(file),
  createdAt: new Date().toISOString(),
  encryption: "AES-256-GCM",
  ivB64: iv.toString("base64"),
  authTagB64: authTag.toString("base64"),
  sha256,
};
await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2) + "\n", { mode: 0o600 });
console.log(file);
