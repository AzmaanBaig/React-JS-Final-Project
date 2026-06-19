import React from 'react';
import CellGridDataMatrix from './CellGridDataMatrix';
import GridTelemetryHUD from './GridTelemetryHUD';
import styles from './SpreadsheetStage.module.css';

export default function SpreadsheetStage() {
  return (
    <div className={styles.stage}>
      <CellGridDataMatrix />
      <GridTelemetryHUD />
    </div>
  );
}
