import { create } from 'zustand';
import { evaluateFormula, extractRefs, detectCycle, topoSort } from '../utils/formulaEngine';

const COLS = 10; // A–J
const ROWS = 30;

const colLabel = (i) => String.fromCharCode(65 + i);
export { COLS, ROWS, colLabel };

function emptyCell() {
  return { raw: '', computed: '', formula: '', error: false, circular: false };
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem('gridcalc-state');
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveToStorage(cells) {
  try { localStorage.setItem('gridcalc-state', JSON.stringify(cells)); } catch {}
}

export const useSpreadsheetStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  cells:         loadFromStorage(),
  selectedCell:  null,
  editingCell:   null,
  editValue:     '',
  circularCells: new Set(),
  telemetry: {
    activeCells: 0,
    edgeCount: 0,
    latencyMs: 0,
    memBytes: 0,
    lastCalcTime: null,
  },
  log: [],

  // ── Selectors ────────────────────────────────────────────────────────────
  getCell(id) {
    return get().cells[id] || emptyCell();
  },
  getCellValue(id) {
    const c = get().cells[id];
    if (!c) return '';
    return c.error ? 0 : c.computed;
  },

  // ── Actions ──────────────────────────────────────────────────────────────
  selectCell(id) { set({ selectedCell: id }); },

  startEdit(id, initialValue) {
    const cell = get().cells[id] || emptyCell();
    set({ editingCell: id, editValue: initialValue !== undefined ? initialValue : cell.raw });
  },

  setEditValue(val) { set({ editValue: val }); },

  commitEdit(id) {
    const { editValue } = get();
    get()._setCellRaw(id, editValue);
    set({ editingCell: null, editValue: '' });
  },

  cancelEdit() { set({ editingCell: null, editValue: '' }); },

  _setCellRaw(id, raw) {
    const t0 = performance.now();
    const cells = { ...get().cells };
    if (!raw && !cells[id]) return;

    if (!raw) {
      delete cells[id];
    } else {
      cells[id] = { ...(cells[id] || emptyCell()), raw };
    }

    // Build dependency map
    const deps = {};
    for (const [cid, cell] of Object.entries(cells)) {
      if (cell.raw.startsWith('=')) {
        deps[cid] = extractRefs(cell.raw);
      } else {
        deps[cid] = [];
      }
    }

    // Detect circular refs
    const circularCells = new Set();
    for (const cid of Object.keys(deps)) {
      if (detectCycle(cid, deps)) circularCells.add(cid);
    }

    // Topo sort
    const order = topoSort(deps);

    // Evaluate in order
    const getCellValue = (refId) => {
      const c = cells[refId];
      if (!c || c.error || c.circular) return 0;
      return c.computed;
    };

    const evalOrder = order || Object.keys(cells);

    for (const cid of evalOrder) {
      if (!cells[cid]) continue;
      const cell = cells[cid];
      if (circularCells.has(cid)) {
        cells[cid] = { ...cell, computed: '#CIRC', error: true, circular: true };
        continue;
      }
      if (cell.raw.startsWith('=')) {
        let computed;
        try {
          computed = evaluateFormula(cell.raw, getCellValue);
          if (computed === '#ERR' || computed === undefined || computed === null) {
            cells[cid] = { ...cell, computed: '#ERR', error: true, circular: false };
          } else {
            const displayVal = typeof computed === 'number'
              ? (Number.isInteger(computed) ? computed : parseFloat(computed.toFixed(6)))
              : computed;
            cells[cid] = { ...cell, computed: displayVal, error: false, circular: false };
          }
        } catch {
          cells[cid] = { ...cell, computed: '#ERR', error: true, circular: false };
        }
      } else {
        cells[cid] = { ...cell, computed: cell.raw, error: false, circular: false };
      }
    }

    const latencyMs = parseFloat((performance.now() - t0).toFixed(3));
    const activeCells = Object.keys(cells).length;
    const edgeCount = Object.values(deps).reduce((s, d) => s + d.length, 0);
    const memBytes = new Blob([JSON.stringify(cells)]).size;

    saveToStorage(cells);

    const newLog = {
      time: new Date().toLocaleTimeString(),
      msg: `Recalculated ${activeCells} cells · ${edgeCount} edges · ${latencyMs}ms`,
      type: circularCells.size > 0 ? 'warn' : 'info',
    };

    set({
      cells,
      circularCells,
      telemetry: {
        activeCells,
        edgeCount,
        latencyMs,
        memBytes,
        lastCalcTime: new Date().toLocaleTimeString(),
      },
      log: [newLog, ...get().log].slice(0, 20),
    });
  },

  clearSheet() {
    localStorage.removeItem('gridcalc-state');
    set({
      cells: {},
      circularCells: new Set(),
      selectedCell: null,
      editingCell: null,
      editValue: '',
      telemetry: { activeCells:0, edgeCount:0, latencyMs:0, memBytes:0, lastCalcTime:null },
      log: [{ time: new Date().toLocaleTimeString(), msg: 'Sheet cleared.', type: 'info' }],
    });
  },

  injectSampleData() {
    const data = {
      A1: 'Q1', B1: 'Q2', C1: 'Q3', D1: 'Q4',
      A2: '12500', B2: '18200', C2: '21400', D2: '19800',
      A3: '8100',  B3: '9400',  C3: '11200', D3: '10500',
      A4: '=A2-A3', B4: '=B2-B3', C4: '=C2-C3', D4: '=D2-D3',
      A5: '=SUM(A2:D2)', B5: '=AVERAGE(A2:D2)', C5: '=MAX(A2:D2)', D5: '=MIN(A2:D2)',
      E1: 'Total', E2: '=SUM(A2:D2)', E3: '=SUM(A3:D3)', E4: '=SUM(A4:D4)',
      A6: '=SQRT(A2)', B6: '=ABS(-99)', C6: '=COUNT(A2:D2)', D6: '=MULTIPLY(A2,2)',
    };
    Object.entries(data).forEach(([id, raw]) => get()._setCellRaw(id, raw));
    set(s => ({ log: [{ time: new Date().toLocaleTimeString(), msg: 'Financial projection injected.', type: 'success' }, ...s.log].slice(0,20) }));
  },

  forceRecalc() {
    const cells = get().cells;
    Object.keys(cells).forEach(id => get()._setCellRaw(id, cells[id]?.raw || ''));
    set(s => ({ log: [{ time: new Date().toLocaleTimeString(), msg: 'Force recalculation complete.', type: 'success' }, ...s.log].slice(0,20) }));
  },

  exportCSV() {
    const { cells } = get();
    const rows = [];
    for (let r = 1; r <= ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const id = colLabel(c) + r;
        const cell = cells[id];
        row.push(cell ? String(cell.computed ?? cell.raw) : '');
      }
      if (row.some(v => v)) rows.push(row.join(','));
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'gridcalc-export.csv'; a.click();
    URL.revokeObjectURL(url);
  },
}));
