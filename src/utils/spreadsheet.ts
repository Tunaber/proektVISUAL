import type { CellData, CellPosition, CellRange, DocumentData } from '../types';

export function cellKey(row: number, col: number): string {
  return `${row}_${col}`;
}

export function colLabel(index: number): string {
  let label = '';
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

export function parseCellRef(ref: string): CellPosition | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  const colStr = match[1].toUpperCase();
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + colStr.charCodeAt(i) - 64;
  }
  return { row: parseInt(match[2], 10) - 1, col: col - 1 };
}

export function cellRefString(row: number, col: number): string {
  return `${colLabel(col)}${row + 1}`;
}

function rangeRefs(range: CellRange): string[] {
  const refs: string[] = [];
  for (let r = range.start.row; r <= range.end.row; r++) {
    for (let c = range.start.col; c <= range.end.col; c++) {
      refs.push(cellRefString(r, c));
    }
  }
  return refs;
}

export function evaluateFormula(formula: string, cells: Record<string, CellData>): string | number | boolean {
  const expr = formula.startsWith('=') ? formula.slice(1) : formula;
  const exprUpper = expr.toUpperCase();

  const cellValues = (ref: string): number[] => {
    const range = parseRange(ref);
    if (!range) {
      const pos = parseCellRef(ref);
      if (pos) {
        const key = cellKey(pos.row, pos.col);
        const cell = cells[key];
        const val = cell?.computedValue !== undefined ? cell.computedValue : cell?.value;
        const num = parseFloat(String(val));
        return isNaN(num) ? [0] : [num];
      }
      return [0];
    }
    const refs = rangeRefs(range);
    return refs.map((r) => {
      const pos = parseCellRef(r);
      if (!pos) return 0;
      const key = cellKey(pos.row, pos.col);
      const cell = cells[key];
      const val = cell?.computedValue !== undefined ? cell.computedValue : cell?.value;
      const num = parseFloat(String(val));
      return isNaN(num) ? 0 : num;
    });
  };

  const fnMatch = exprUpper.match(/^(SUM|AVERAGE|MIN|MAX|COUNT)\((.+)\)$/);
  if (fnMatch) {
    const fn = fnMatch[1];
    const vals = cellValues(fnMatch[2].trim());
    switch (fn) {
      case 'SUM':
        return vals.reduce((a, b) => a + b, 0);
      case 'AVERAGE':
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      case 'MIN':
        return vals.length ? Math.min(...vals) : 0;
      case 'MAX':
        return vals.length ? Math.max(...vals) : 0;
      case 'COUNT':
        return vals.length;
    }
  }

  try {
    let evalExpr = expr;
    const refPattern = /([A-Z]+\d+)/gi;
    const refs = evalExpr.match(refPattern);
    if (refs) {
      for (const ref of refs) {
        const pos = parseCellRef(ref);
        if (pos) {
          const key = cellKey(pos.row, pos.col);
          const cell = cells[key];
          const val = cell?.computedValue !== undefined ? cell.computedValue : cell?.value;
          const num = parseFloat(String(val));
          evalExpr = evalExpr.replace(ref, isNaN(num) ? '0' : String(num));
        }
      }
    }
    const result = Function(`'use strict'; return (${evalExpr})`)();
    if (typeof result === 'number') return result;
    if (typeof result === 'boolean') return result;
    return String(result);
  } catch {
    return '#ERROR';
  }
}

function parseRange(ref: string): CellRange | null {
  const parts = ref.split(':');
  if (parts.length !== 2) return null;
  const start = parseCellRef(parts[0].trim());
  const end = parseCellRef(parts[1].trim());
  if (!start || !end) return null;
  return {
    start: { row: Math.min(start.row, end.row), col: Math.min(start.col, end.col) },
    end: { row: Math.max(start.row, end.row), col: Math.max(start.col, end.col) },
  };
}

export function computeCellValue(
  value: string,
  cells: Record<string, CellData>,
): { type: CellData['type']; computedValue: CellData['computedValue'] } {
  if (value.startsWith('=')) {
    return { type: 'formula', computedValue: evaluateFormula(value, cells) };
  }
  if (value === 'true' || value === 'false') {
    return { type: 'boolean', computedValue: value === 'true' };
  }
  const num = Number(value);
  if (value !== '' && !isNaN(num)) {
    return { type: 'number', computedValue: num };
  }
  return { type: 'string', computedValue: value };
}

export function getCellInRange(range: CellRange, cells: Record<string, CellData>): Record<string, CellData> {
  const result: Record<string, CellData> = {};
  for (let r = range.start.row; r <= range.end.row; r++) {
    for (let c = range.start.col; c <= range.end.col; c++) {
      const key = cellKey(r, c);
      if (cells[key]) {
        result[key] = { ...cells[key] };
      }
    }
  }
  return result;
}

export function cloneDocument(doc: DocumentData): DocumentData {
  return JSON.parse(JSON.stringify(doc));
}

export function createEmptyCell(): CellData {
  return {
    value: '',
    type: 'string',
    style: {},
    computedValue: '',
  };
}
