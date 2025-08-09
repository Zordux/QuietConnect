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

  Write-Host "---Start-Data---"
  Write-Host $base64
  Write-Host "---Data-End---"
}
