import os
import sys
import base64

script_dir = os.path.dirname(os.path.abspath(__file__))
input_file = os.path.join(script_dir, "screenshot_base64.txt")
print(f"[*] Reading Base64 data from file: {input_file}")

if not os.path.exists(input_file):
    print("[!] ERROR: Input file not found.")
    sys.exit(1)

data_lines = []
with open(input_file, "r", encoding="utf-16") as f:
    lines = f.read().splitlines()

def find_marker(lines, marker):
    for i, line in enumerate(lines):
        if line.strip() == marker:
            return i
    return -1

start_index = find_marker(lines, '---Start-Data---')
end_index = find_marker(lines, '---End-Data---')

if start_index == -1 or end_index == -1:
    print("[!] ERROR: Data markers not found.")
    sys.exit(1)

if end_index <= start_index:
    print("[!] ERROR: Invalid data markers.")
    sys.exit(1)

# skipping chunk markers (only accept base64)
for line in lines[start_index + 1:end_index]:
    if line.strip() in ("---Chunk-Start---", "---Chunk-End---"):
        continue
    data_lines.append(line.strip())

base64_data = ''.join(data_lines)

print("[*] Decoding Base64 data...")

try:
    raw_data = base64.b64decode(base64_data.encode('utf-8'))
except Exception as e:
    print(f"[!] ERROR: Failed to decode Base64: {e}")
    sys.exit(1)

output_path = os.path.join(script_dir, "photo.png")
print(f"[*] Saving screenshot to: {output_path}")

with open(output_path, "wb") as file:
    file.write(raw_data)

print("[*] Screenshot saved successfully.")
