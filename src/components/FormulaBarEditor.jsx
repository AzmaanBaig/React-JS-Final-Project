import React, { useEffect, useRef } from 'react';
import { useSpreadsheetStore, COLS, ROWS, colLabel } from '../store/spreadsheetStore';
import styles from './FormulaBar.module.css';

export default function FormulaBarEditor() {
  const {
    selectedCell, editingCell, editValue, cells,
    selectCell, startEdit, setEditValue, commitEdit, cancelEdit,
  } = useSpreadsheetStore();

  const inputRef = useRef(null);

  const displayId = editingCell || selectedCell || '—';
  const isEditing = Boolean(editingCell);

  const displayValue = isEditing
    ? editValue
    : (selectedCell ? (cells[selectedCell]?.raw || '') : '');

  const isFormula = displayValue.startsWith('=');

  // Re-focus whenever a fresh edit session starts (e.g. double-click on
  // a grid cell calls startEdit, which changes editingCell here).
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // put the cursor at the end instead of selecting all text
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [editingCell]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e) {
    setEditValue(e.target.value);
  }

  function moveSelection(id, dRow, dCol) {
    const col = id.charCodeAt(0) - 65;
    const row = parseInt(id.slice(1), 10);
    const nextCol = Math.min(Math.max(col + dCol, 0), COLS - 1);
    const nextRow = Math.min(Math.max(row + dRow, 1), ROWS);
    selectCell(colLabel(nextCol) + nextRow);
  }

  function handleKeyDown(e) {
    const target = editingCell || selectedCell || 'A1';
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit(target);
      moveSelection(target, 1, 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit(target);
      moveSelection(target, 0, 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }

  // Clicking (or tabbing) into the bar always starts an edit session on
  // whatever cell is currently selected (defaulting to A1 if nothing is
  // selected yet). This is the single source of truth for text entry —
  // the grid itself is read-only display, so there's no competing input
  // fighting for focus.
  function handleFocus() {
    const target = selectedCell || 'A1';
    if (!selectedCell) selectCell(target);
    if (editingCell !== target) startEdit(target);
  }

  return (
    <div className={styles.bar}>
      <div className={styles.cellRef}>
        <span className={styles.cellRefLabel}>fx</span>
        <span className={styles.cellId}>{displayId}</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.inputWrap}>
        <input
          ref={inputRef}
          data-formula-input
          className={`${styles.input} ${isFormula ? styles.formula : ''}`}
          value={isEditing ? editValue : displayValue}
          onFocus={handleFocus}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Click here or a grid cell, then type..."
        />
      </div>

      {isEditing && (
        <div className={styles.hints}>
          <span className={styles.hint}><kbd>Enter</kbd> confirm</span>
          <span className={styles.hint}><kbd>Tab</kbd> next cell</span>
          <span className={styles.hint}><kbd>Esc</kbd> cancel</span>
        </div>
      )}

      {isFormula && !isEditing && (
        <div className={styles.formulaTag}>FORMULA</div>
      )}
    </div>
  );
}
