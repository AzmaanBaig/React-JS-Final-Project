import React from 'react';
import { useSpreadsheetStore } from '../store/spreadsheetStore';
import styles from './Toolbar.module.css';

const actions = [
  { key: 'clear',   icon: '⌫', label: 'Clear Sheet',           action: s => s.clearSheet()       },
  { key: 'inject',  icon: '⚡', label: 'Inject Sample Data',    action: s => s.injectSampleData() },
  { key: 'recalc',  icon: '↺', label: 'Force Recalculation',   action: s => s.forceRecalc()      },
  { key: 'export',  icon: '↓', label: 'Export CSV',            action: s => s.exportCSV()        },
];

export default function ToolbarActionStrip({ theme, onToggleTheme }) {
  const store = useSpreadsheetStore();
  const isDark = theme === 'dark';

  return (
    <div className={styles.toolbar}>
      <div className={styles.brand}>
        <span className={styles.logo}>⬡</span>
        <span className={styles.brandText}>GridCalc</span>
        <span className={styles.badge}>v1.0</span>
      </div>

      <div className={styles.actions}>
        {actions.map(({ key, icon, label, action }) => (
          <button
            key={key}
            className={styles.btn}
            onClick={() => action(store)}
            title={label}
          >
            <span className={styles.btnIcon}>{icon}</span>
            <span className={styles.btnLabel}>{label}</span>
          </button>
        ))}
      </div>

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <span className={styles.dot} style={{background:'var(--green)'}} />
          Client-Side Engine
        </span>
        <span className={styles.metaItem}>
          <span className={styles.dot} style={{background:'var(--accent2)'}} />
          React + Zustand
        </span>

        {/* ── Theme Toggle ── */}
        <button
          className={styles.themeToggle}
          onClick={onToggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          <span className={`${styles.toggleTrack} ${isDark ? styles.dark : styles.light}`}>
            <span className={styles.toggleThumb}>
              {isDark ? '🌙' : '☀️'}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
