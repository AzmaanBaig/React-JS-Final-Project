import React, { useState } from 'react';
import { useSpreadsheetStore } from '../store/spreadsheetStore';
import styles from './TelemetryHUD.module.css';

function MetricCard({ label, value, color, icon }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricIcon}>{icon}</span>
      <div>
        <div className={styles.metricValue} style={{ color }}>
          {value}
        </div>
        <div className={styles.metricLabel}>{label}</div>
      </div>
    </div>
  );
}

export default function GridTelemetryHUD() {
  const { telemetry, log, exportCSV, circularCells } = useSpreadsheetStore();
  const [collapsed, setCollapsed] = useState(false);

  const bytes = telemetry.memBytes;
  const memDisplay = bytes > 1024 ? `${(bytes/1024).toFixed(1)}KB` : `${bytes}B`;

  return (
    <div className={`${styles.hud} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.hudHeader} onClick={() => setCollapsed(c => !c)}>
        <span className={styles.hudTitle}>
          <span className={styles.hudIcon}>◉</span>
          System Telemetry
        </span>
        <div className={styles.hudMeta}>
          {circularCells.size > 0 && (
            <span className={styles.circularBadge}>
              ⚠ {circularCells.size} Circular Ref{circularCells.size > 1 ? 's' : ''}
            </span>
          )}
          {telemetry.lastCalcTime && (
            <span className={styles.lastCalc}>Last calc: {telemetry.lastCalcTime}</span>
          )}
          <button className={styles.exportBtn} onClick={e => { e.stopPropagation(); exportCSV(); }}>
            ↓ Export CSV
          </button>
          <span className={styles.collapseBtn}>{collapsed ? '▲' : '▼'}</span>
        </div>
      </div>

      {!collapsed && (
        <div className={styles.hudBody}>
          <div className={styles.metrics}>
            <MetricCard icon="◈" label="Active Cells"   value={telemetry.activeCells} color="var(--accent2)" />
            <MetricCard icon="⟶" label="Graph Edges"    value={telemetry.edgeCount}   color="var(--green)"   />
            <MetricCard icon="⏱" label="Latency (ms)"   value={telemetry.latencyMs}   color="var(--amber)"   />
            <MetricCard icon="⊟" label="Memory"         value={memDisplay}             color="var(--text2)"   />
          </div>

          <div className={styles.logPanel}>
            <div className={styles.logHeader}>Evaluation Log</div>
            <div className={styles.logEntries}>
              {log.length === 0 && (
                <div className={styles.logEmpty}>No events yet. Edit a cell to begin.</div>
              )}
              {log.map((entry, i) => (
                <div key={i} className={`${styles.logEntry} ${styles[entry.type]}`}>
                  <span className={styles.logTime}>{entry.time}</span>
                  <span className={styles.logMsg}>{entry.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
