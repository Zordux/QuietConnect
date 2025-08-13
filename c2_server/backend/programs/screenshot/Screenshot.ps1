powershell -Command {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $bounds = New-Object System.Drawing.Rectangle 0, 0, 2560, 1600
    $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
    $graphics.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()

    $bytes = $ms.ToArray()
    $ms.Dispose()

    $base64 = [Convert]::ToBase64String($bytes)

    $chunkSize = 13333 # 10kb at a time
    $chunks = [System.Text.RegularExpressions.Regex]::Split($base64, "(.{$chunkSize})") | Where-Object { $_ -ne "" }

    Write-Host "---Start-Data---"
    foreach ($chunk in $chunks) {
        Write-Host "---Chunk-Start---"
        Write-Host $chunk
        Write-Host "---Chunk-End---"
    }
    Write-Host "---End-Data---"
}
