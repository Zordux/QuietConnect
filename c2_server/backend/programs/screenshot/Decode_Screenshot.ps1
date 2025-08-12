# path to the input text file containing the data
$inputFile = Join-Path (Split-Path $MyInvocation.MyCommand.Path) "screenshot_base64.txt"
Write-Host "[*] Reading Base64 data from file: $inputFile"

if (-Not (Test-Path $inputFile)) {
    Write-Host "[!] ERROR: Input file not found."
    exit 1
}

# read all lines from the file
$lines = Get-Content -Path $inputFile

# find start and end markers
$startIndex = $lines.IndexOf('---Start-Data---')
$endIndex = $lines.IndexOf('---Data-End---')

if ($startIndex -lt 0 -or $endIndex -lt 0 -or $endIndex -le $startIndex) {
    Write-Host "[!] ERROR: Data markers not found or invalid."
    exit 1
}

# extract Base64 lines between markers (exclude markers)
$base64Lines = $lines[($startIndex + 1)..($endIndex - 1)]

$base64 = $base64Lines -join ''

Write-Host "[*] Decoding Base64 data..."

try {
    $bytes = [Convert]::FromBase64String($base64)
} catch {
    Write-Host "[!] ERROR: Failed to decode Base64."
    exit 1
}

# save to photo.png in same folder as script
$outputPath = Join-Path (Split-Path $MyInvocation.MyCommand.Path) "photo.png"

Write-Host "[*] Saving screenshot to: $outputPath"
[IO.File]::WriteAllBytes($outputPath, $bytes)

Write-Host "[*] Screenshot saved successfully."
