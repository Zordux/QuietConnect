import os
import sys
import base64

# TODO: Modify Filetransfer.ps1 to have a header including program / file name.

# get base64 input from command-line argument
if len(sys.argv) < 2:
    print("[!] ERROR: No Base64 input provided as argument.")
    sys.exit(1)

input_data = sys.argv[1]

# split input into lines and skip markers
lines = input_data.splitlines()
data_lines = []

for line in lines:
    stripped = line.strip()
    if stripped in ("---Start-Data---", "---End-Data---") 
        continue
    data_lines.append(stripped)

base64_data = ''.join(data_lines)

script_dir = os.path.dirname(os.path.abspath(__file__))
                                                            # replace photo.png with header
output_path = os.path.join(script_dir, "..", "..", "clients", "photo.png")
output_path = os.path.normpath(output_path)  

print("[*] Decoding Base64 data...")

try:
    raw_data = base64.b64decode(base64_data.encode('utf-8'))
except Exception as e:
    print(f"[!] ERROR: Failed to decode Base64: {e}")
    sys.exit(1)

with open(output_path, "wb") as file:
    file.write(raw_data)

print(f"[*] Screenshot transferred successfully to: {output_path}")
