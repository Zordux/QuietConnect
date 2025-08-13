powershell -Command {
  Write-Host "---Start-Data---"
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("WANTED\DIRECTORY\HERE"))
  Write-Host "---End-Data---"
}
