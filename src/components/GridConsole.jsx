import React from 'react';
import FormulaBarEditor from './FormulaBarEditor';
import styles from './GridConsole.module.css';

export default function GridConsole() {
  return (
    <div className={styles.console}>
      <FormulaBarEditor />
    </div>
  );
}
