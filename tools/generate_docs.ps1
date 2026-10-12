# Generates docs/ (DEPENDENCIES.md, STRUCTURE.md, FEATURES.md skeleton) from the repo.
param()
$root = Split-Path -Parent $PSScriptRoot
$docs = Join-Path $root 'docs'
New-Item -ItemType Directory -Force -Path $docs | Out-Null

# DEPENDENCIES.md
$url = ''
$key = ''
$cfg = Join-Path $root 'config.js'
if (Test-Path $cfg) {
  $c = Get-Content $cfg -Raw
  if ($c -match "SUPABASE_URL\s*=\s*'([^']+)'") { $url = $Matches[1] }
  if ($c -match "SUPABASE_ANON_KEY\s*=\s*'([^']+)'") { $key = 'sb_publishable_… (من config.js)' }
}
$deps = @"
# الخدمات والاعتمادات — Services & Dependencies
> مولّدة تلقائياً من config.js — Generated from config.js.

| الخدمة — Service | القيمة — Value |
|---|---|
| Supabase URL | `$url` |
| Supabase Key | `$key` (publishable فقط — never expose service_role) |
| Tailwind CSS | CDN `https://cdn.tailwindcss.com` |
| Supabase JS | CDN `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` |
| الاستضافة | GitHub Pages (branch main, root) |

---
*لا تعدّل يدوياً — أعد التوليد (Do not edit by hand).*
"@
Set-Content -LiteralPath (Join-Path $docs 'DEPENDENCIES.md') -Value $deps -Encoding UTF8

# STRUCTURE.md
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# بنية الملفات — File Structure')
[void]$sb.AppendLine()
[void]$sb.AppendLine('> مولّدة تلقائياً — Generated from the repository.')
[void]$sb.AppendLine()
[void]$sb.AppendLine('```')
function Walk($dir, $indent) {
  Get-ChildItem -LiteralPath $dir | Sort-Object @{e={$_.PSIsContainer};Descending=$true}, Name | ForEach-Object {
    if ($_.Name -in @('.git','docs','build')) { return }
    [void]$sb.AppendLine("$indent$(if ($_.PSIsContainer) {'📁 '} else {'📄 '})$($_.Name)")
    if ($_.PSIsContainer) { Walk $_.FullName ($indent + '    ') }
  }
}
Walk $root ''
[void]$sb.AppendLine('```')
[void]$sb.AppendLine()
[void]$sb.AppendLine('---')
[void]$sb.AppendLine('*لا تعدّل يدوياً — أعد التوليد (Do not edit by hand).*')
Set-Content -LiteralPath (Join-Path $docs 'STRUCTURE.md') -Value $sb.ToString() -Encoding UTF8

Write-Output "docs regenerated -> docs/ (DEPENDENCIES.md, STRUCTURE.md)"
