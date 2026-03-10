powershell -Command {
  Write-Host "---Start-Data---"
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("WANTED\FILE\HERE"))
  Write-Host "---End-Data---"
}
