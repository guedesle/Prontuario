# Backup e restauração

## Objetivo
O prontuário deve conseguir recuperar dados após falha humana, corrupção, perda do servidor ou implantação defeituosa.

## Política mínima
- backup diário automático do banco;
- backup adicional antes de migration destrutiva ou deploy com alteração de schema;
- retenção sugerida: 7 diários + 4 semanais + 12 mensais, ajustável à política da clínica;
- cópia fora do servidor principal;
- armazenamento criptografado;
- teste de restauração periódico em banco **não produtivo**;
- nunca armazenar backup no GitHub.

## Scripts incluídos

### Backup
```bash
DATABASE_URL=... \
BACKUP_ENCRYPTION_KEY_B64=... \
BACKUP_DIR=/caminho/seguro \
node scripts/backup-mysql.mjs
```

O arquivo é comprimido e cifrado com AES-256-GCM. Um manifesto separado contém IV, authentication tag e SHA-256 do arquivo cifrado.

### Restore
Restaurar primeiro em homologação:
```bash
RESTORE_CONFIRM=RESTORE \
DATABASE_URL=... \
BACKUP_ENCRYPTION_KEY_B64=... \
node scripts/restore-mysql.mjs /caminho/backup.sql.gz.enc
```

Em produção existe uma segunda trava deliberada:
```bash
RESTORE_CONFIRM=RESTORE \
RESTORE_PRODUCTION_CONFIRM=RESTORE_PRODUCTION \
NODE_ENV=production ...
```

## Validação pós-restore
1. executar `prisma migrate status`;
2. iniciar aplicação em modo restrito;
3. validar contagens de pacientes/consultas/documentos;
4. executar smoke tests com dados sintéticos;
5. validar vínculo paciente ↔ consulta ↔ documento;
6. somente então reabrir acesso clínico.

## Chave de backup
A chave não deve ficar dentro do mesmo backup, no repositório ou em documentação. Use secret manager/variável segura do ambiente e mantenha uma cópia de recuperação sob controle administrativo.
