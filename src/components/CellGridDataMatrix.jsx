import React, { useCallback, useRef } from 'react';
import { useSpreadsheetStore, COLS, ROWS, colLabel } from '../store/spreadsheetStore';
import styles from './CellGrid.module.css';

export default function CellGridDataMatrix() {
  const {
    cells, selectedCell, editingCell, editValue, circularCells,
    selectCell, startEdit, commitEdit,
  } = useSpreadsheetStore();

  const gridRef = useRef(null);

  // Single click: just select the cell. Editing always happens through
  // the formula bar, which is the single source of truth for text input.
  // (Having two separate <input> elements bound to the same edit state
  // caused a focus race — typing in one would get yanked by the other's
  // autofocus/blur handlers, making it impossible to type reliably.)
  const handleCellClick = useCallback((id) => {
    if (editingCell && editingCell !== id) commitEdit(editingCell);
    selectCell(id);
  }, [editingCell, commitEdit, selectCell]);

  // Double click: select AND jump straight into edit mode via the
  // formula bar (it owns focus, so this just primes the state — the
  // formula bar's effect will focus itself when editingCell changes).
  const handleCellDblClick = useCallback((id) => {
    selectCell(id);
    startEdit(id);
  }, [selectCell, startEdit]);

  function renderCell(colIdx, rowIdx) {
    const id = colLabel(colIdx) + (rowIdx + 1);
    const cell = cells[id];
    const isSelected = selectedCell === id;
    const isEditing  = editingCell === id;
    const isCircular = circularCells.has(id);
    const isError    = cell?.error;
    const isFormula  = cell?.raw?.startsWith('=');
    const computed   = cell?.computed;

    // While this cell is being edited, show the live in-progress text
    // so the grid stays in sync with what's being typed in the formula
    // bar — but this is read-only display, never its own input.
    let displayVal = '';
    if (isEditing) displayVal = editValue;
    else if (cell) displayVal = String(computed ?? cell.raw ?? '');

    return (
      <td
        key={id}
        className={[
          styles.cell,
          isSelected ? styles.selected : '',
          isCircular ? styles.circular : '',
          isError    ? styles.error    : '',
          isFormula && !isError ? styles.hasFormula : '',
          isEditing  ? styles.editing  : '',
        ].join(' ')}
        onClick={() => handleCellClick(id)}
        onDoubleClick={() => handleCellDblClick(id)}
        title={isCircular ? 'Circular Reference Detected' : (isError ? 'Formula Error' : '')}
      >
        <span className={styles.cellValue}>{displayVal}</span>
        {isFormula && !isEditing && !isError && (
          <span className={styles.formulaDot} />
        )}
      </td>
    );
  }

  return (
    <div className={styles.gridWrap} ref={gridRef}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.cornerCell} />
            {Array.from({ length: COLS }, (_, ci) => (
              <th key={ci} className={styles.colHeader}>
                {colLabel(ci)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }, (_, ri) => (
            <tr key={ri}>
              <td className={styles.rowHeader}>{ri + 1}</td>
              {Array.from({ length: COLS }, (_, ci) => renderCell(ci, ri))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
