import React, { useEffect, useState } from 'react';
import ToolbarActionStrip from './components/ToolbarActionStrip';
import GridConsole        from './components/GridConsole';
import SpreadsheetStage   from './components/SpreadsheetStage';
import { useTheme }       from './store/useTheme';
import { useSpreadsheetStore } from './store/spreadsheetStore';
import styles from './App.module.css';

// ── Splash / Intro Screen ──────────────────────────────────────────────────
function SplashScreen({ onEnter }) {
  return (
    <div className={styles.splash}>
      <div className={styles.splashContent}>
        <div className={styles.splashLogo}>⬡</div>
        <h1 className={styles.splashTitle}>GridCalc</h1>
        <p className={styles.splashSub}>Spreadsheet Multi-Cell Calculation Processor</p>
        <div className={styles.splashFeatures}>
          <span className={styles.splashTag}>DAG Engine</span>
          <span className={styles.splashTag}>Formula Parser</span>
          <span className={styles.splashTag}>Cycle Detection</span>
          <span className={styles.splashTag}>Topo Sort</span>
          <span className={styles.splashTag}>Zustand State</span>
          <span className={styles.splashTag}>LocalStorage</span>
        </div>
        <button className={styles.splashBtn} onClick={onEnter}>
          Open Workspace →
        </button>
        <p className={styles.splashCredit}>B.Tech CSE 2025–29 · React JS Case Study · Semester II</p>
      </div>
      <div className={styles.splashGrid} aria-hidden="true">
        {Array.from({ length: 80 }).map((_, i) => (
          <div key={i} className={styles.splashCell} style={{ animationDelay: `${(i * 37) % 1200}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ── Type-to-edit: lets you click a cell once, then just start typing,
// exactly like Excel/Google Sheets. Only fires when focus isn't already
// inside an input (so it doesn't steal keystrokes from the formula bar).
function useTypeToEdit() {
  const { selectedCell, editingCell, startEdit } = useSpreadsheetStore();

  useEffect(() => {
    function handler(e) {
      const tag = document.activeElement?.tagName;
      const alreadyTyping = tag === 'INPUT' || tag === 'TEXTAREA';
      if (alreadyTyping || editingCell || !selectedCell) return;

      // Single printable character, no modifier keys held
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        startEdit(selectedCell, e.key);
        // focus the formula bar input on next tick so the keystroke lands there
        requestAnimationFrame(() => {
          const input = document.querySelector('[data-formula-input]');
          if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }
        });
      } else if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        startEdit(selectedCell);
        requestAnimationFrame(() => {
          document.querySelector('[data-formula-input]')?.focus();
        });
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        startEdit(selectedCell, '');
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCell, editingCell, startEdit]);
}

// ── Root App ───────────────────────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);
  const { theme, toggle } = useTheme();
  useTypeToEdit();

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') e.preventDefault();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!ready) return <SplashScreen onEnter={() => setReady(true)} />;

  return (
    <div className={styles.app}>
      <ToolbarActionStrip theme={theme} onToggleTheme={toggle} />
      <GridConsole />
      <SpreadsheetStage />
    </div>
  );
}
