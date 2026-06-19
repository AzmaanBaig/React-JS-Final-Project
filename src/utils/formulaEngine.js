// ── Lexical Tokenizer ──────────────────────────────────────────────────────
export function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[+\-*/(),:]/.test(ch)) { tokens.push({ type: 'OP', value: ch }); i++; continue; }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(expr[i+1]))) {
      let num = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) num += expr[i++];
      tokens.push({ type: 'NUM', value: parseFloat(num) });
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      let word = '';
      while (i < expr.length && /[A-Za-z0-9]/.test(expr[i])) word += expr[i++];
      const upper = word.toUpperCase();
      if (/^[A-Z]+\d+$/.test(upper)) tokens.push({ type: 'REF', value: upper });
      else tokens.push({ type: 'FUNC', value: upper });
      continue;
    }
    i++;
  }
  return tokens;
}

// ── Cell Reference Extractor ───────────────────────────────────────────────
export function extractRefs(formula) {
  if (!formula.startsWith('=')) return [];
  const refs = [];
  const tokens = tokenize(formula.slice(1));
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'REF') refs.push(tokens[i].value);
    // expand range A1:B3
    if (tokens[i].type === 'OP' && tokens[i].value === ':' && i > 0 && i < tokens.length - 1) {
      const start = tokens[i-1].value;
      const end   = tokens[i+1].value;
      if (start && end) {
        const range = expandRange(start, end);
        range.forEach(r => { if (!refs.includes(r)) refs.push(r); });
      }
    }
  }
  return [...new Set(refs)];
}

export function expandRange(start, end) {
  const [sc, sr] = parseRef(start);
  const [ec, er] = parseRef(end);
  const cells = [];
  for (let c = sc.charCodeAt(0); c <= ec.charCodeAt(0); c++)
    for (let r = sr; r <= er; r++)
      cells.push(String.fromCharCode(c) + r);
  return cells;
}

export function parseRef(ref) {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  if (!m) return ['A', 1];
  return [m[1], parseInt(m[2], 10)];
}

// ── Evaluator ─────────────────────────────────────────────────────────────
export function evaluateFormula(formula, getCellValue) {
  if (!formula.startsWith('=')) {
    const n = parseFloat(formula);
    return isNaN(n) ? formula : n;
  }
  const expr = formula.slice(1);
  try {
    return evalExpr(expr, getCellValue);
  } catch (e) {
    return '#ERR';
  }
}

function evalExpr(expr, get) {
  // expand functions first
  const expanded = expandFunctions(expr, get);
  // safe numeric eval
  const sanitized = expanded.replace(/[^0-9+\-*/().,\s]/g, '');
  // eslint-disable-next-line no-new-func
  const result = Function('"use strict"; return (' + sanitized + ')')();
  return isFinite(result) ? parseFloat(result.toFixed(10)) : '#ERR';
}

function expandFunctions(expr, get) {
  // Replace cell refs first
  let out = expr.replace(/\b([A-Z]+\d+)\b/g, (_, ref) => {
    const v = get(ref);
    if (v === null || v === undefined || v === '') return '0';
    const n = parseFloat(v);
    return isNaN(n) ? '0' : String(n);
  });

  // Expand SUM(A1:B3) or SUM(1,2,3)
  out = out.replace(/SUM\(([^)]+)\)/gi, (_, args) => {
    const nums = resolveArgs(args, get);
    return nums.reduce((a, b) => a + b, 0).toString();
  });

  // AVERAGE
  out = out.replace(/AVERAGE\(([^)]+)\)/gi, (_, args) => {
    const nums = resolveArgs(args, get);
    return nums.length ? (nums.reduce((a,b)=>a+b,0)/nums.length).toString() : '0';
  });

  // MIN / MAX
  out = out.replace(/MIN\(([^)]+)\)/gi,  (_, args) => Math.min(...resolveArgs(args, get)).toString());
  out = out.replace(/MAX\(([^)]+)\)/gi,  (_, args) => Math.max(...resolveArgs(args, get)).toString());
  out = out.replace(/MULTIPLY\(([^)]+)\)/gi, (_, args) => resolveArgs(args, get).reduce((a,b)=>a*b,1).toString());
  out = out.replace(/COUNT\(([^)]+)\)/gi,    (_, args) => resolveArgs(args, get).length.toString());
  out = out.replace(/SQRT\(([^)]+)\)/gi,     (_, args) => Math.sqrt(resolveArgs(args, get)[0] || 0).toString());
  out = out.replace(/ABS\(([^)]+)\)/gi,      (_, args) => Math.abs(resolveArgs(args, get)[0] || 0).toString());

  return out;
}

function resolveArgs(argsStr, get) {
  // handle range notation
  const expanded = argsStr.replace(/([A-Z]+\d+):([A-Z]+\d+)/g, (_, s, e) => expandRange(s, e).join(','));
  return expanded.split(',').map(a => {
    const t = a.trim();
    const n = parseFloat(t);
    return isNaN(n) ? 0 : n;
  }).filter(n => !isNaN(n));
}

// ── Topological Sort (Kahn's Algorithm) ───────────────────────────────────
export function topoSort(deps) {
  // deps: { cellId: [deps...] }
  const inDegree = {};
  const graph = {}; // parent -> [children that depend on parent]
  const allCells = new Set(Object.keys(deps));

  for (const cell of allCells) {
    inDegree[cell] = inDegree[cell] ?? 0;
    graph[cell]    = graph[cell]    ?? [];
    for (const dep of deps[cell]) {
      allCells.add(dep);
      graph[dep] = graph[dep] ?? [];
      graph[dep].push(cell);
      inDegree[cell] = (inDegree[cell] || 0);
    }
  }
  // Rebuild inDegrees properly
  for (const cell of allCells) inDegree[cell] = (deps[cell] || []).length;

  const queue = [...allCells].filter(c => inDegree[c] === 0);
  const order = [];
  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    for (const child of (graph[node] || [])) {
      inDegree[child]--;
      if (inDegree[child] === 0) queue.push(child);
    }
  }
  return order.length === allCells.size ? order : null; // null = cycle
}

// ── DFS Cycle Detector ─────────────────────────────────────────────────────
export function detectCycle(startCell, deps) {
  const visited = new Set();
  const stack   = new Set();
  function dfs(cell) {
    if (stack.has(cell)) return true;
    if (visited.has(cell)) return false;
    visited.add(cell);
    stack.add(cell);
    for (const dep of (deps[cell] || [])) {
      if (dfs(dep)) return true;
    }
    stack.delete(cell);
    return false;
  }
  return dfs(startCell);
}
