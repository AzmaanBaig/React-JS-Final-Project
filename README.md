#  📊  GridCalc — Spreadsheet Multi-Cell Calculation Processor

**B.Tech CSE 2025–29 · React JS Case Study · Semester II · ITM Skills University**

---

## Overview

A modern spreadsheet-like web application built using React and Vite.  
GridCalc allows users to input, calculate, and manage structured data efficiently with a clean UI.

---

## 🌐 Live Demo

👉 https://grid-clac.netlify.app/

---

## 📸 Screenshots

<img width="1710" height="1018" alt="Screenshot 2026-06-08 at 3 32 40 PM" src="https://github.com/user-attachments/assets/791b44ed-5913-43ad-b6e6-55d7bfb613db" />



<img width="1710" height="1013" alt="Screenshot 2026-06-08 at 3 32 59 PM" src="https://github.com/user-attachments/assets/420aa05f-8732-4a36-a8d1-84a19390bc98" />



<img width="1708" height="1029" alt="Screenshot 2026-06-08 at 3 32 52 PM" src="https://github.com/user-attachments/assets/873a32ab-f754-413b-95fa-382585294015" />


---

## ⚙️ Tech Stack

- React.js
- Vite
- JavaScript (ES6+)
- CSS3
- Netlify (Deployment)

---

## ✨ Features

- 📊 Spreadsheet-style grid UI
- ➕ Add / edit / update cells
- ⚡ Fast rendering with Vite
- 💾 Persistent state handling
- 📱 Responsive design
- 🎯 Clean modern UI

---

## Tech Stack

| Concern | Tool |
|---|---|
| UI Framework | React 18 (JSX, Hooks, StrictMode) |
| State Management | Zustand |
| Styling | CSS Modules |
| Build Tool | Vite |
| Persistence | localStorage |
| Fonts | DM Mono, Syne, DM Sans (Google Fonts) |

---

## Core React Concepts Covered

- **Functional Components** — every UI element is a React function component
- **useState / useCallback / useEffect / useRef** — full hooks coverage
- **Zustand store** — central state management with selectors
- **CSS Modules** — scoped component styles
- **Conditional rendering** — selected/editing/error cell states
- **Event handling** — onClick, onDoubleClick, onKeyDown, onChange, onBlur
- **Lifting state up** — store shared between toolbar, formula bar, grid
- **Component composition** — App > Toolbar + GridConsole + Stage > Grid + HUD

---

## Project Structure

```
src/
├── components/
│   ├── ToolbarActionStrip.jsx   # Action buttons
│   ├── Toolbar.module.css
│   ├── FormulaBarEditor.jsx     # Formula input bar
│   ├── FormulaBar.module.css
│   ├── GridConsole.jsx          # Groups formula bar
│   ├── GridConsole.module.css
│   ├── CellGridDataMatrix.jsx   # Spreadsheet grid
│   ├── CellGrid.module.css
│   ├── GridTelemetryHUD.jsx     # Status panel
│   ├── TelemetryHUD.module.css
│   ├── SpreadsheetStage.jsx     # Grid + HUD layout
│   └── SpreadsheetStage.module.css
├── store/
│   └── spreadsheetStore.js      # Zustand store
├── utils/
│   └── formulaEngine.js         # Tokenizer, evaluator, DAG, cycle detection
├── App.jsx                      # Root component + splash screen
├── App.module.css
├── index.css                    # Global tokens + keyframes
└── main.jsx                     # ReactDOM.createRoot entry
```

---

## Supported Formulas

```
=SUM(A1:B3)        Sum of a range
=AVERAGE(A1:D1)    Average of a range
=MAX(A1:D1)        Maximum value
=MIN(A1:D1)        Minimum value
=MULTIPLY(A1, 3)   Multiply
=COUNT(A1:D1)      Count numeric cells
=SQRT(A1)          Square root
=ABS(-50)          Absolute value
=A1+B1*C1          Arithmetic expressions
=SUM(A1:A5)/5      Nested expressions
```

---

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

---

## Key Algorithms

### 1. Lexical Tokenizer
Breaks formula strings into typed tokens: `NUM`, `REF`, `FUNC`, `OP`.

### 2. Abstract Syntax Tree Evaluation
Uses function expansion and safe `Function()` evaluation for arithmetic.

### 3. DAG Dependency Tracking
Builds a directed graph where each cell node tracks its dependencies. When a cell updates, all downstream cells are re-evaluated.

### 4. Topological Sort (Kahn's Algorithm)
Determines the correct evaluation order across the dependency graph, ensuring cells are calculated only after their dependencies.

### 5. DFS Cycle Detection
Before evaluation, a Depth-First Search scans the dependency graph for circular references. Offending cells are marked `#CIRC` and highlighted in red.

---

*Built with React + Zustand + Vite · ITM Skills University*
