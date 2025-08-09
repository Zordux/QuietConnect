# QuietConnect

> **Silent Command & Control for Research Labs**  
> A research-focused Command & Control (C2) framework for cybersecurity education, malware analysis training, and red team simulation in controlled environments.

---

## ⚠️ Disclaimer

**QuietConnect** is intended **solely for educational and research purposes** in authorized environments.  
The authors and contributors **do not condone, encourage, or take responsibility for any malicious use** of this code.

By using this project, you agree that:
- You are conducting testing in a **controlled lab environment**.
- You have **explicit permission** to run tests on the systems you use.
- You accept **full responsibility** for any consequences of its use.

---

## 📚 Overview

**QuietConnect** simulates a C2 (Command & Control) architecture for learning and security research.  
It demonstrates:
- How C2 servers and clients communicate securely and discreetly.
- Command queuing, execution, and result reporting.
- Building and monitoring a lab-based victim dashboard.

---

## 🛠 Components

- **`c2_server/`** → NodeJS C2 server with a live React dashboard. 
- **`payloads/`** → Example client payload and payload loader (PowerShell & C#) for lab testing.

---

## 💡 Planned Changes & Ideas

We are actively working on improving **QuietConnect** and adding new research capabilities:   
- **Improved Dashboard UI** → Add filtering, search, and per-client command history.
- **Migration to Electron** → Moving from a web-based dashboard to more of a desktop app. 
- **Encrypted C2 Channel** → Implement HTTPS/TLS and/or symmetric encryption for payload-server communication.  
- **Event Logging Enhancements** → Store detailed timestamps, IPs, and session data for research analysis.  
- **Pluggable Modules** → Enable easy creation of custom commands or tests without editing core code.

---
## 🔒 Safety Guidelines

- Run **only** inside a **segmented lab network**.
- Never connect lab payloads to public-facing IPs/domains.
- Replace domains/URLs with **internal lab addresses** before use.
- Use virtual machines or isolated systems for testing.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).  
Provided **"as is"** without warranty of any kind.  
The authors are **not liable** for misuse or damage caused by this software.

