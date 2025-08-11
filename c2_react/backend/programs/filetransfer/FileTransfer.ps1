param (
  [Parameter(Mandatory=$true)]
  [string]$path
)
if (-not (Test-Path $path)) {
  Write-Host "File not found: $path"
  exit 1
}

Write-Host "---Start-Data---"
[Convert]::ToBase64String([IO.File]::ReadAllBytes($path))
Write-Host "---End-Data---"
