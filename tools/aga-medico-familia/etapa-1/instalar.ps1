#requires -Version 5.1
<#
Instalador AGA Etapa 1 - v5. Independente dos instaladores anteriores.
Salvar em C:\projetos\aga-prontuario-primeira-etapa, ao lado de payload\.
Armazena logs e backups APENAS na pasta deste script.
Aceita main modificada SOMENTE nos arquivos gerados next-env.d.ts e
 tsconfig.tsbuildinfo, sem aplicar stash nem alterar esses arquivos.
Nunca modifica .env, banco, credenciais, remotes, commits ou GitHub.
#>
[CmdletBinding()]
param([string]$RepoPath = 'C:\projetos\prontuario')

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath($RepoPath).TrimEnd('\')
$central = $PSScriptRoot
$payloadRoot = Join-Path $central 'payload'
$logs = Join-Path $central 'artefatos\logs'
$backups = Join-Path $central 'artefatos\backups'
$branchWanted = 'feature/aga-medico-familia-etapa-1'
$expectedMain = '3f0982d42e50f6def9ba70f846730a0585327237'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$gitExe = (Get-Command git.exe -CommandType Application -ErrorAction Stop).Source
$planned = @{}

function Read-Git {
    param([string[]]$ArgsList)
    $out = & $script:gitExe -C $script:repo @ArgsList 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Git falhou ($LASTEXITCODE): $($ArgsList -join ' ')`n$(@($out) -join "`n")"
    }
    return (@($out) -join "`n").Trim()
}
function To-FullPath {
    param([string]$Relative)
    return Join-Path $script:repo ($Relative.Replace('/', '\'))
}
function Read-File {
    param([string]$Relative)
    $path = To-FullPath $Relative
    if (-not [IO.File]::Exists($path)) { throw "Arquivo exigido nao encontrado: $Relative" }
    return [IO.File]::ReadAllText($path)
}
function Replace-One {
    param([string]$Text, [string]$Before, [string]$After, [string]$Label)
    $start = $Text.IndexOf($Before, [StringComparison]::Ordinal)
    if ($start -lt 0) { throw "Marcador nao encontrado em $Label" }
    if ($Text.IndexOf($Before, $start + $Before.Length, [StringComparison]::Ordinal) -ge 0) {
        throw "Marcador ambiguo em $Label"
    }
    return $Text.Substring(0, $start) + $After + $Text.Substring($start + $Before.Length)
}
function Remove-TestBlock {
    param([string]$Text, [string]$StartMarker, [string]$Label)
    $start = $Text.IndexOf($StartMarker, [StringComparison]::Ordinal)
    if ($start -lt 0) { throw "Nao encontrei inicio do teste legado: $Label" }
    $remainder = $Text.Substring($start)
    # Localiza o fechamento de test(...) no inicio da linha, independente de CRLF/LF.
    $match = [Regex]::Match($remainder, '(?m)^\}\);[ \t]*(?:\r?\n|$)')
    if (-not $match.Success) { throw "Nao encontrei fim do teste legado: $Label" }
    return $Text.Remove($start, $match.Index + $match.Length)
}
function Queue-File {
    param([string]$Relative, [string]$Content)
    $path = To-FullPath $Relative
    if ([IO.File]::Exists($path)) {
        if ([IO.File]::ReadAllText($path) -ceq $Content) { return }
    }
    $localStatus = Read-Git -ArgsList @('status', '--porcelain=v1', '--untracked-files=all', '--', $Relative)
    if ($localStatus.Length -gt 0) {
        throw "Ha alteracao local no arquivo que seria alterado: $Relative. Nao sera sobrescrito."
    }
    $script:planned[$Relative] = $Content
}

if (-not [IO.Directory]::Exists($repo)) { throw "Repositorio nao encontrado: $repo" }
if (-not [IO.Directory]::Exists($payloadRoot)) { throw "Payload nao encontrado ao lado deste script: $payloadRoot" }
if ($repo.StartsWith($central.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
    throw 'O repositorio deve ficar fora da pasta descartavel de instalacao.'
}
$root = (Read-Git -ArgsList @('rev-parse', '--show-toplevel')).Replace('/', '\').TrimEnd('\')
if (-not $root.Equals($repo, [StringComparison]::OrdinalIgnoreCase)) { throw "Pasta incorreta: $root" }
$origin = Read-Git -ArgsList @('remote', 'get-url', 'origin')
$upstream = Read-Git -ArgsList @('remote', 'get-url', 'upstream')
if ($origin -notmatch '^https://github\.com/guedesle/Prontuario(\.git)?/?$') { throw "Origin inesperado: $origin" }
if ($upstream -notmatch '^https://github\.com/natimn4-dev/Prontuario(\.git)?/?$') { throw "Upstream inesperado: $upstream" }
$initialBranch = Read-Git -ArgsList @('branch', '--show-current')
if ($initialBranch -notin @('main', 'chore/isolar-autenticacao-fork', $branchWanted)) {
    throw "Branch inesperada: $initialBranch. Nenhuma alteracao feita."
}
if ($initialBranch -eq 'main') {
    if ((Read-Git -ArgsList @('rev-parse', 'HEAD')) -ne $expectedMain) {
        throw 'A main possui outro commit. Reavalie o estado antes de instalar.'
    }
    if ((Read-Git -ArgsList @('branch', '--list', $branchWanted)).Length -gt 0) {
        throw "Branch de destino ja existe: $branchWanted. Selecione-a somente apos verificar seu conteudo."
    }
}
if ((Read-Git -ArgsList @('ls-files', '-u')).Length -gt 0) {
    throw 'Ha conflitos de merge; resolva-os antes da instalacao.'
}

# Os dois arquivos abaixo sao gerados/modificados automaticamente pelo Next.js e TypeScript.
# O Git utiliza dois caracteres de status, incluindo espacos iniciais.
# Read-Git remove espacos nas extremidades da saida; portanto NAO usamos
# Substring ou parsing do status para decidir quais alteracoes sao permitidas.
# Usamos pathspecs de exclusao nativos do Git: os dois arquivos ficam intactos
# e todas as OUTRAS alteracoes continuam bloqueadas, inclusive arquivos novos.
$changes = Read-Git -ArgsList @(
    'status', '--porcelain=v1', '--untracked-files=all', '--', '.',
    ':(exclude)next-env.d.ts',
    ':(exclude)tsconfig.tsbuildinfo'
)
if (-not [string]::IsNullOrWhiteSpace($changes)) {
    throw "Existem outras alteracoes locais que exigem revisao:`n$changes`nNenhum arquivo foi alterado."
}

New-Item -ItemType Directory -Path $logs, $backups -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logPath = Join-Path $logs "instalacao-v5-$stamp.txt"
$backupDir = Join-Path $backups "instalacao-v5-$stamp"
function Report {
    param([string]$Message)
    Write-Host $Message
    Add-Content -LiteralPath $script:logPath -Encoding UTF8 -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $Message"
}
Report "Instalacao v5 iniciada em $repo; branch: $initialBranch"
Report 'Arquivos gerados do Next/TS, se modificados, serao preservados sem novo stash.'

# Isolamento de acesso - apenas codigo e testes; nenhum usuario ou dado e alterado.
$authFile = 'src/server/auth/auth.ts'
$auth = Read-File $authFile
$legacy = $auth.Contains('approvedProductionEmailFingerprints') -or $auth.Contains('canonicalProductionAppUrl')
if ($legacy) {
    Report 'Encontrada autorizacao legada. Preparando sua remocao.'
    $auth = Replace-One $auth 'import { createHash } from "node:crypto";' '' 'auth.ts/import createHash'
    $begin = $auth.IndexOf('const canonicalProductionAppUrl =', [StringComparison]::Ordinal)
    $end = $auth.IndexOf('export function isWorkspaceAccessAuthorized(', [StringComparison]::Ordinal)
    if ($begin -lt 0 -or $end -le $begin) { throw 'Trecho legado de auth.ts nao corresponde ao esperado; nada aplicado.' }
    $nl = if ($auth.Contains("`r`n")) { "`r`n" } else { "`n" }
    $newCode = 'export function isAuthorizedEmail(email: string): boolean {' + $nl +
               '  return isEmailAllowed(email, allowedEmails);' + $nl + '}' + $nl + $nl
    $auth = $auth.Substring(0, $begin) + $newCode + $auth.Substring($end)
    $auth = Replace-One $auth 'const legacyAuthorized = isAuthorizedEmail(user.email);' 'const allowlisted = isAuthorizedEmail(user.email);' 'auth.ts/login'
    $auth = Replace-One $auth 'if (!legacyAuthorized && !grant)' 'if (!allowlisted && !grant)' 'auth.ts/guarda'
} elseif (-not $auth.Contains('return isEmailAllowed(email, allowedEmails);')) {
    throw 'auth.ts sem contrato conhecido; revise-o antes de instalar.'
}
if ($auth -match 'approvedProductionEmailFingerprints|canonicalProductionAppUrl|isApprovedProductionEmail|usesApprovedProductionAccessContract') {
    throw 'Persistem marcadores de autorizacao legada em auth.ts; instalacao bloqueada.'
}
Queue-File $authFile $auth

$testFile = 'tests/golden-master/security-auth.test.ts'
$test = Read-File $testFile
$constStart = $test.IndexOf('const approvedProductionPrincipalFingerprints = [', [StringComparison]::Ordinal)
if ($constStart -ge 0) {
    $constEnd = $test.IndexOf('] as const;', $constStart, [StringComparison]::Ordinal)
    if ($constEnd -lt 0) { throw 'Constante legada do teste sem fechamento reconhecido.' }
    $constEnd += '] as const;'.Length
    while ($constEnd -lt $test.Length -and ($test[$constEnd] -eq "`r" -or $test[$constEnd] -eq "`n")) { $constEnd++ }
    $test = $test.Remove($constStart, $constEnd - $constStart)
}
$firstMark = 'test("regressão: produção mantém exatamente quatro identidades'
$secondMark = 'test("regressão: as quatro identidades aprovadas'
if ($test.Contains($firstMark)) { $test = Remove-TestBlock $test $firstMark 'primeiro teste de acesso legado' }
if ($test.Contains($secondMark)) { $test = Remove-TestBlock $test $secondMark 'segundo teste de acesso legado' }
if ($test.Contains('approvedProductionPrincipalFingerprints') -or $test.Contains('regressão: produção mantém exatamente quatro identidades')) {
    throw 'Ainda restam testes exigindo identidades do sistema original.'
}
if (-not $test.Contains('fork: acesso legado nao pode ser autorizado')) {
    $test += @'

test("fork: acesso legado nao pode ser autorizado", () => {
  assert.doesNotMatch(authServer, /approvedProductionEmailFingerprints|canonicalProductionAppUrl|isApprovedProductionEmail|usesApprovedProductionAccessContract/);
  assert.match(authServer, /return isEmailAllowed\(email, allowedEmails\);/);
  assert.match(authServer, /if \(!allowlisted && !grant\)/);
  assert.match(authServer, /prisma\.userAccessGrant\.findFirst/);
});
'@
    $test += "`n"
}
Queue-File $testFile $test

$docFile = 'docs/AUTHENTICATION.md'
$doc = Read-File $docFile
$doc = $doc.Replace('- identidades legadas explicitamente aprovadas no contrato fechado de produção;', '- e-mails explicitamente incluidos em `AUTH_ALLOWED_EMAILS`;')
$doc = $doc.Replace('https://prontuario.nataliamendesgeriatra.com/api/auth/callback/google', 'https://seu-dominio.example/api/auth/callback/google')
if (-not $doc.Contains('## Independencia do fork')) {
    $doc += "`n## Independencia do fork`nAcesso autorizado exclusivamente por allowlist local ou autorizacao ativa em UserAccessGrant. Nao ha usuarios aprovados implicitamente pelo sistema original.`n"
}
Queue-File $docFile $doc

$ignoreFile = '.gitignore'
$ignore = Read-File $ignoreFile
if ($ignore -notmatch '(?m)^\.local/$') { $ignore = $ignore.TrimEnd() + "`n`n# Credenciais locais e operacionais`n.local/`n" }
Queue-File $ignoreFile $ignore

$oauthFile = 'src/app/auth/google/route.ts'
$oauth = Read-File $oauthFile
if ($oauth.Contains('callbackURL: "/",')) {
    $oauth = Replace-One $oauth 'callbackURL: "/",' 'callbackURL: "/modulos",' $oauthFile
} elseif (-not $oauth.Contains('callbackURL: "/modulos",')) {
    throw 'Callback OAuth diferente do esperado; nenhuma mudanca aplicada.'
}
Queue-File $oauthFile $oauth

$homeFile = 'src/app/page.tsx'
$homePage = Read-File $homeFile
if (-not $homePage.Contains('aria-label="Seleção de módulo"')) {
    $nav = @'
<main className="shell home-shell">
      <nav aria-label="Seleção de módulo" style={{ marginBottom: 18 }}>
        <a href="/modulos" style={{ display: "inline-flex", alignItems: "center", padding: "9px 14px", background: "#f4eefb", borderRadius: 10, textDecoration: "none" }}>← Escolher módulo</a>
      </nav>
'@
    $homePage = Replace-One $homePage '<main className="shell home-shell">' $nav $homeFile
}
Queue-File $homeFile $homePage

$files = @(Get-ChildItem -LiteralPath $payloadRoot -File -Recurse)
if ($files.Count -lt 10) { throw 'Payload incompleto. Extraia o ZIP unificado na pasta central.' }
foreach ($f in $files) {
    $rel = $f.FullName.Substring($payloadRoot.Length + 1).Replace('\', '/')
    if ($rel -notmatch '^(src/|docs/|public/|tests/)') { throw "Arquivo de payload fora do escopo permitido: $rel" }
    if ($rel -ne 'src/app/login/page.tsx' -and [IO.File]::Exists((To-FullPath $rel))) {
        $current = [IO.File]::ReadAllText((To-FullPath $rel))
        $incoming = [IO.File]::ReadAllText($f.FullName)
        if ($current -cne $incoming) { throw "Arquivo de payload existente e diferente: $rel. Nada sobrescrito." }
    }
    Queue-File $rel ([IO.File]::ReadAllText($f.FullName))
}

Report "Plano pronto: $($planned.Count) arquivos. Nenhum arquivo foi modificado ate aqui."
if ($planned.Count -eq 0) { Report 'Nada a instalar: arquivos correspondem ao pacote.'; exit 0 }
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$written = New-Object 'System.Collections.Generic.List[string]'
$createdBranch = $false
try {
    foreach ($rel in @($planned.Keys)) {
        $dest = To-FullPath $rel
        if ([IO.File]::Exists($dest)) {
            $backup = Join-Path $backupDir ($rel.Replace('/', '\'))
            New-Item -ItemType Directory -Path (Split-Path $backup -Parent) -Force | Out-Null
            [IO.File]::Copy($dest, $backup, $true)
        }
    }
    Report "Backup dos arquivos que mudarao: $backupDir"
    if ($initialBranch -eq 'main') {
        [void](Read-Git -ArgsList @('switch', '-c', $branchWanted))
        $createdBranch = $true
    }
    foreach ($rel in @($planned.Keys)) {
        $dest = To-FullPath $rel
        $parent = Split-Path $dest -Parent
        if (-not [IO.Directory]::Exists($parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        [IO.File]::WriteAllText($dest, [string]$planned[$rel], $utf8)
        $written.Add($rel)
    }
    Push-Location $repo
    try {
        Report 'Executando typecheck...'
        & npm.cmd run typecheck
        if ($LASTEXITCODE -ne 0) { throw 'Typecheck falhou' }
        Report 'Executando testes de autenticacao e AGA...'
        & node.exe --experimental-strip-types --test tests/golden-master/security-auth.test.ts tests/golden-master/family-aga-journey.test.ts tests/golden-master/login-google-entrypoint.test.ts tests/golden-master/google-oauth-login-entrypoint.test.ts
        if ($LASTEXITCODE -ne 0) { throw 'Testes direcionados falharam' }
        $diffArgs = @('-C', $repo, 'diff', '--check', '--') + [string[]]@($planned.Keys)
        & $gitExe @diffArgs
        if ($LASTEXITCODE -ne 0) { throw 'git diff --check falhou' }
    } finally { Pop-Location }
    Report 'SUCESSO: telas instaladas, autorizacao isolada e validacoes concluídas.'
    Report "Branch: $(Read-Git -ArgsList @('branch', '--show-current'))"
    Report 'Rotas: /login /modulos /aga-medico-familia'
    Report 'Mudancas permanecem locais. Revise e versione apenas o codigo planejado.'
} catch {
    $errorDetail = $_.Exception.Message
    Report "Falha na verificacao: $errorDetail. Restaurando somente arquivos desta tentativa."
    foreach ($rel in $written) {
        $dest = To-FullPath $rel
        $saved = Join-Path $backupDir ($rel.Replace('/', '\'))
        if ([IO.File]::Exists($saved)) { [IO.File]::Copy($saved, $dest, $true) }
        elseif ([IO.File]::Exists($dest)) { [IO.File]::Delete($dest) }
    }
    if ($createdBranch) {
        try {
            [void](Read-Git -ArgsList @('switch', $initialBranch))
            [void](Read-Git -ArgsList @('branch', '-d', $branchWanted))
        } catch { Report 'Branch auxiliar preservada; confira git branch e git status.' }
    }
    throw "Instalacao cancelada. Arquivos da tentativa restaurados. Backup: $backupDir. Detalhe: $errorDetail"
}
