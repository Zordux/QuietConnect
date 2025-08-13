powershell -Command {
  Write-Host "---Start-Data---"
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\computer2\Desktop\Decode_Screenshot.ps1"))
  Write-Host "---End-Data---"
}
