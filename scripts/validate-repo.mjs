import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const forbiddenNames = [
  /(^|\/)\.env($|\.)/,
  /(^|\/)backups\//i,
  /(^|\/)patient-data\//i,
  /(^|\/)clinical-exports\//i,
  /\.(sql|dump|bak|sqlite|db)(\.gz|\.enc)?$/i,
];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /AIza[0-9A-Za-z_-]{30,}/,
];

const violations = [];
for (const file of files) {
  if (file === ".env.example") continue;
  if (forbiddenNames.some((pattern) => pattern.test(file))) {
    violations.push(`arquivo proibido: ${file}`);
    continue;
  }
  if (/\.(png|jpe?g|gif|webp|pdf|zip|bundle)$/i.test(file)) continue;
  try {
    const text = readFileSync(file, "utf8");
    for (const pattern of secretPatterns) {
      if (pattern.test(text)) violations.push(`possível segredo em ${file}: ${pattern}`);
    }
  } catch {
    // Arquivo não textual: ignorado pela varredura de conteúdo.
  }
}

if (violations.length) {
  console.error(violations.join("\n"));
  process.exit(1);
}
console.log(`Repository safety check: ${files.length} arquivos rastreados, nenhuma violação detectada.`);
