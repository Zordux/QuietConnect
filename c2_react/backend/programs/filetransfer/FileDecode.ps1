param (
    [Parameter(Mandatory=$true)]
    [string]$Base64File,  
    [Parameter(Mandatory=$true)]
    [string]$OutputPath   
)

if (-not (Test-Path $Base64File)) {
    Write-Host "Base64 file not found: $Base64File"
    exit 1
}

$raw = Get-Content $Base64File | Where-Object {
    ($_ -ne "---Start-Data---") -and ($_ -ne "---End-Data---") -and ($_ -ne "")
} | ForEach-Object { $_.Trim() } | Out-String

$bytes = [Convert]::FromBase64String($raw)

[IO.File]::WriteAllBytes($OutputPath, $bytes)

Write-Host "Decoded file saved to $OutputPath"
