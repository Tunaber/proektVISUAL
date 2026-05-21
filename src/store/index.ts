import { configureStore, createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

// ============ TYPES ============
interface CellStyle {
  bold?: boolean; italic?: boolean; underline?: boolean;
  fontSize?: number; fontFamily?: string; color?: string;
  backgroundColor?: string; textAlign?: 'left' | 'center' | 'right';
  numberFormat?: 'number' | 'percent' | 'currency' | 'date';
}
interface CellData { value: string; type: 'string' | 'number' | 'boolean' | 'formula'; style: CellStyle; computedValue?: string | number | boolean }
interface CellPosition { row: number; col: number }
interface CellRange { start: CellPosition; end: CellPosition }
interface DocumentData { id: string; name: string; userId: string; rows: number; cols: number; cells: Record<string, CellData>; columnWidths: Record<number, number>; rowHeights: Record<number, number>; createdAt: string; updatedAt: string }
interface DocumentMeta { id: string; name: string; userId: string; rows: number; cols: number; createdAt: string; updatedAt: string; preview: string[][] }
type SaveStatus = 'saved' | 'saving' | 'error'
interface User { id: string; name: string; email: string; createdAt: string }
interface AuthState { user: User | null; accessToken: string | null; isAuthenticated: boolean; loading: boolean; error: string | null }
interface SpreadsheetState { document: DocumentData | null; activeCell: CellPosition | null; selectedRange: CellRange | null; editValue: string | null; isEditing: boolean; clipboard: { range: CellRange; data: Record<string, CellData> } | null; undoStack: DocumentData[]; redoStack: DocumentData[]; loading: boolean; error: string | null }
interface UISliceState { saveStatus: SaveStatus; contextMenu: { x: number; y: number; row: number; col: number } | null; modal: { type: string; props?: Record<string, unknown> } | null; notification: { message: string; type: 'success' | 'error' | 'info' } | null }
interface DocumentsState { documents: DocumentMeta[]; loading: boolean; error: string | null }

// ============ LOCAL STORAGE API ============
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const STORAGE_KEY = 'spreadsheet_docs';
const META_KEY = 'spreadsheet_meta';

function getMeta(): DocumentMeta[] {
  const raw = localStorage.getItem(META_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveMeta(meta: DocumentMeta[]) { localStorage.setItem(META_KEY, JSON.stringify(meta)) }
function getDoc(id: string): DocumentData | null {
  const raw = localStorage.getItem(`${STORAGE_KEY}_${id}`);
  return raw ? JSON.parse(raw) : null;
}
function putDoc(doc: DocumentData) { localStorage.setItem(`${STORAGE_KEY}_${doc.id}`, JSON.stringify(doc)) }
function removeDoc(id: string) { localStorage.removeItem(`${STORAGE_KEY}_${id}`) }
let docCounter = Date.now();

const api = {
  async getDocuments(userId: string): Promise<DocumentMeta[]> {
    await delay(200);
    return getMeta().filter((d) => d.userId === userId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },
  async getDocument(id: string): Promise<DocumentData | null> { await delay(150); return getDoc(id) },
  async createDocument(userId: string, name: string, rows: number, cols: number): Promise<DocumentData> {
    await delay(300);
    const now = new Date().toISOString();
    const doc: DocumentData = { id: `doc_${++docCounter}`, name, userId, rows, cols, cells: {}, columnWidths: {}, rowHeights: {}, createdAt: now, updatedAt: now };
    putDoc(doc);
    const meta: DocumentMeta = { id: doc.id, name: doc.name, userId: doc.userId, rows: doc.rows, cols: Math.min(doc.cols, 3), createdAt: doc.createdAt, updatedAt: doc.updatedAt, preview: [] };
    const all = getMeta();
    all.push(meta);
    saveMeta(all);
    return doc;
  },
  async updateDocument(id: string, data: Partial<DocumentData>): Promise<DocumentData> {
    await delay(100);
    const doc = getDoc(id);
    if (!doc) throw new Error('Document not found');
    const updated = { ...doc, ...data, updatedAt: new Date().toISOString() };
    putDoc(updated);
    const all = getMeta();
    const idx = all.findIndex((m) => m.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], name: updated.name, rows: updated.rows, updatedAt: updated.updatedAt }; saveMeta(all) }
    return updated;
  },
  async deleteDocument(id: string): Promise<void> {
    await delay(200);
    removeDoc(id);
    saveMeta(getMeta().filter((m) => m.id !== id));
  },
  async duplicateDocument(id: string): Promise<DocumentData> {
    await delay(300);
    const doc = getDoc(id);
    if (!doc) throw new Error('Document not found');
    const now = new Date().toISOString();
    const newDoc: DocumentData = { ...doc, id: `doc_${++docCounter}`, name: `${doc.name} (Copy)`, createdAt: now, updatedAt: now };
    putDoc(newDoc);
    const meta: DocumentMeta = { id: newDoc.id, name: newDoc.name, userId: newDoc.userId, rows: newDoc.rows, cols: Math.min(newDoc.cols, 3), createdAt: now, updatedAt: now, preview: [] };
    const all = getMeta();
    all.push(meta);
    saveMeta(all);
    return newDoc;
  },
  async renameDocument(id: string, name: string): Promise<void> {
    await delay(150);
    const doc = getDoc(id);
    if (doc) { doc.name = name; doc.updatedAt = new Date().toISOString(); putDoc(doc) }
    const all = getMeta();
    const idx = all.findIndex((m) => m.id === id);
    if (idx >= 0) { all[idx].name = name; all[idx].updatedAt = new Date().toISOString(); saveMeta(all) }
  },
};

// ============ SPREADSHEET UTILITIES ============
function cellKey(row: number, col: number): string { return `${row}_${col}` }
function colLabel(index: number): string {
  let label = '';
  let n = index;
  while (n >= 0) { label = String.fromCharCode(65 + (n % 26)) + label; n = Math.floor(n / 26) - 1 }
  return label;
}
function cellRefString(row: number, col: number): string { return `${colLabel(col)}${row + 1}` }
function parseCellRef(ref: string): CellPosition | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  const colStr = match[1].toUpperCase();
  let col = 0;
  for (let i = 0; i < colStr.length; i++) col = col * 26 + colStr.charCodeAt(i) - 64;
  return { row: parseInt(match[2], 10) - 1, col: col - 1 };
}
function rangeRefs(range: CellRange): string[] {
  const refs: string[] = [];
  for (let r = range.start.row; r <= range.end.row; r++)
    for (let c = range.start.col; c <= range.end.col; c++)
      refs.push(cellRefString(r, c));
  return refs;
}
function parseRange(ref: string): CellRange | null {
  const parts = ref.split(':');
  if (parts.length !== 2) return null;
  const start = parseCellRef(parts[0].trim());
  const end = parseCellRef(parts[1].trim());
  if (!start || !end) return null;
  return { start: { row: Math.min(start.row, end.row), col: Math.min(start.col, end.col) }, end: { row: Math.max(start.row, end.row), col: Math.max(start.col, end.col) } };
}
function evaluateFormula(formula: string, cells: Record<string, CellData>): string | number | boolean {
  const expr = formula.startsWith('=') ? formula.slice(1) : formula;
  const exprUpper = expr.toUpperCase();
  const fnMatch = exprUpper.match(/^(SUM|AVERAGE|MIN|MAX|COUNT)\((.+)\)$/);
  if (fnMatch) {
    const fn = fnMatch[1];
    const range = parseRange(fnMatch[2].trim());
    const vals = range ? rangeRefs(range).map((r) => {
      const pos = parseCellRef(r);
      if (!pos) return 0;
      const cell = cells[cellKey(pos.row, pos.col)];
      const v = cell?.computedValue !== undefined ? cell.computedValue : cell?.value;
      const n = parseFloat(String(v));
      return isNaN(n) ? 0 : n;
    }) : [];
    switch (fn) {
      case 'SUM': return vals.reduce((a, b) => a + b, 0);
      case 'AVERAGE': return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      case 'MIN': return vals.length ? Math.min(...vals) : 0;
      case 'MAX': return vals.length ? Math.max(...vals) : 0;
      case 'COUNT': return vals.length;
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
          const cell = cells[cellKey(pos.row, pos.col)];
          const v = cell?.computedValue !== undefined ? cell.computedValue : cell?.value;
          const n = parseFloat(String(v));
          evalExpr = evalExpr.replace(ref, isNaN(n) ? '0' : String(n));
        }
      }
    }
    const result = Function(`'use strict'; return (${evalExpr})`)();
    if (typeof result === 'number') return result;
    if (typeof result === 'boolean') return result;
    return String(result);
  } catch { return '#ERROR' }
}
function computeCellValue(value: string, cells: Record<string, CellData>): { type: CellData['type']; computedValue: CellData['computedValue'] } {
  if (value.startsWith('=')) return { type: 'formula', computedValue: evaluateFormula(value, cells) };
  if (value === 'true' || value === 'false') return { type: 'boolean', computedValue: value === 'true' };
  const num = Number(value);
  if (value !== '' && !isNaN(num)) return { type: 'number', computedValue: num };
  return { type: 'string', computedValue: value };
}
function getCellInRange(range: CellRange, cells: Record<string, CellData>): Record<string, CellData> {
  const result: Record<string, CellData> = {};
  for (let r = range.start.row; r <= range.end.row; r++)
    for (let c = range.start.col; c <= range.end.col; c++) {
      const key = cellKey(r, c);
      if (cells[key]) result[key] = { ...cells[key] };
    }
  return result;
}
function cloneDocument(doc: DocumentData): DocumentData { return JSON.parse(JSON.stringify(doc)) }
function recomputeAllFormulas(cells: Record<string, CellData>): Record<string, CellData> {
  const result = { ...cells };
  for (const [key, cell] of Object.entries(result).filter(([, c]) => c.type === 'formula')) {
    const computed = computeCellValue(cell.value, result);
    result[key] = { ...cell, ...computed };
  }
  return result;
}

// ============ AUTH SLICE ============
const authInitial: AuthState = { user: null, accessToken: null, isAuthenticated: false, loading: false, error: null };

export const login = createAsyncThunk('auth/login', async ({ email, password }: { email: string; password: string }) => {
  await new Promise((r) => setTimeout(r, 500));
  if (!email || !password) throw new Error('Invalid credentials');
  const user: User = { id: 'user_1', name: email.split('@')[0], email, createdAt: new Date().toISOString() };
  return { user, accessToken: 'mock_token_' + Date.now() };
});

export const register = createAsyncThunk('auth/register', async ({ name, email, password }: { name: string; email: string; password: string }) => {
  await new Promise((r) => setTimeout(r, 500));
  if (!email || !password || !name) throw new Error('All fields required');
  const user: User = { id: 'user_' + Date.now(), name, email, createdAt: new Date().toISOString() };
  return { user, accessToken: 'mock_token_' + Date.now() };
});

const authSlice = createSlice({
  name: 'auth', initialState: authInitial,
  reducers: {
    logout(state) { state.user = null; state.accessToken = null; state.isAuthenticated = false; state.error = null },
    setMockUser(state, action) { state.user = action.payload; state.isAuthenticated = true; state.accessToken = 'mock_token' },
    clearError(state) { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; state.accessToken = action.payload.accessToken; state.isAuthenticated = true })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Login failed' })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null })
      .addCase(register.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; state.accessToken = action.payload.accessToken; state.isAuthenticated = true })
      .addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Registration failed' });
  },
});

// ============ DOCUMENTS SLICE ============
const docsInitial: DocumentsState = { documents: [], loading: false, error: null };

export const fetchDocuments = createAsyncThunk('documents/fetchDocuments', async (userId: string) => api.getDocuments(userId));
export const createDocument = createAsyncThunk('documents/createDocument', async ({ userId, name, rows, cols }: { userId: string; name: string; rows: number; cols: number }) => api.createDocument(userId, name, rows, cols));
export const deleteDocument = createAsyncThunk('documents/deleteDocument', async (id: string) => { await api.deleteDocument(id); return id });
export const duplicateDocument = createAsyncThunk('documents/duplicateDocument', async (id: string) => api.duplicateDocument(id));
export const renameDocument = createAsyncThunk('documents/renameDocument', async ({ id, name }: { id: string; name: string }) => { await api.renameDocument(id, name); return { id, name } });

const documentsSlice = createSlice({
  name: 'documents', initialState: docsInitial,
  reducers: { clearDocuments(state) { state.documents = []; state.error = null } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchDocuments.fulfilled, (state, action) => { state.loading = false; state.documents = action.payload })
      .addCase(fetchDocuments.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed to fetch documents' })
      .addCase(createDocument.fulfilled, (state, action) => { state.documents.unshift({ id: action.payload.id, name: action.payload.name, userId: action.payload.userId, rows: action.payload.rows, cols: Math.min(action.payload.cols, 3), createdAt: action.payload.createdAt, updatedAt: action.payload.updatedAt, preview: [] }) })
      .addCase(deleteDocument.fulfilled, (state, action) => { state.documents = state.documents.filter((d) => d.id !== action.payload) })
      .addCase(duplicateDocument.fulfilled, (state, action) => { const d = action.payload; state.documents.unshift({ id: d.id, name: d.name, userId: d.userId, rows: d.rows, cols: Math.min(d.cols, 3), createdAt: d.createdAt, updatedAt: d.updatedAt, preview: [] }) })
      .addCase(renameDocument.fulfilled, (state, action) => { const doc = state.documents.find((d) => d.id === action.payload.id); if (doc) doc.name = action.payload.name });
  },
});

// ============ UI SLICE ============
const uiInitial: UISliceState = { saveStatus: 'saved', contextMenu: null, modal: null, notification: null };

const uiSlice = createSlice({
  name: 'ui', initialState: uiInitial,
  reducers: {
    setSaveStatus(state, action: PayloadAction<SaveStatus>) { state.saveStatus = action.payload },
    showContextMenu(state, action: PayloadAction<{ x: number; y: number; row: number; col: number }>) { state.contextMenu = action.payload },
    hideContextMenu(state) { state.contextMenu = null },
    showNotification(state, action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' }>) { state.notification = action.payload },
    hideNotification(state) { state.notification = null },
  },
});

// ============ SPREADSHEET SLICE ============
const ssInitial: SpreadsheetState = { document: null, activeCell: null, selectedRange: null, editValue: null, isEditing: false, clipboard: null, undoStack: [], redoStack: [], loading: false, error: null };

export const loadDocument = createAsyncThunk('spreadsheet/loadDocument', async (id: string) => {
  const doc = await api.getDocument(id);
  if (!doc) throw new Error('Document not found');
  return doc;
});
export const saveDocument = createAsyncThunk('spreadsheet/saveDocument', async (doc: DocumentData) => {
  await api.updateDocument(doc.id, { cells: doc.cells, columnWidths: doc.columnWidths, rowHeights: doc.rowHeights, name: doc.name });
  return doc;
});

const spreadsheetSlice = createSlice({
  name: 'spreadsheet', initialState: ssInitial,
  reducers: {
    setActiveCell(state, action: PayloadAction<CellPosition | null>) { state.activeCell = action.payload; if (action.payload) state.selectedRange = { start: action.payload, end: action.payload } },
    setSelectedRange(state, action: PayloadAction<CellRange | null>) { state.selectedRange = action.payload },
    startEditing(state) { if (state.activeCell && state.document) { state.isEditing = true; state.editValue = state.document.cells[cellKey(state.activeCell.row, state.activeCell.col)]?.value || '' } },
    setEditValue(state, action: PayloadAction<string>) { state.editValue = action.payload },
    commitEdit(state) {
      if (!state.activeCell || !state.document || state.editValue === null) return;
      state.isEditing = false;
      const key = cellKey(state.activeCell.row, state.activeCell.col);
      const newDoc = cloneDocument(state.document);
      if (state.editValue === '') { delete newDoc.cells[key] } else {
        const computed = computeCellValue(state.editValue, newDoc.cells);
        newDoc.cells[key] = { value: state.editValue, type: computed.type, style: newDoc.cells[key]?.style || {}, computedValue: computed.computedValue };
      }
      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document)); state.redoStack = []; state.document = newDoc; state.editValue = null;
    },
    cancelEdit(state) { state.isEditing = false; state.editValue = null },
    setCellValue(state, action: PayloadAction<{ row: number; col: number; value: string }>) {
      if (!state.document) return;
      const { row, col, value } = action.payload;
      const key = cellKey(row, col);
      const newDoc = cloneDocument(state.document);
      if (value === '') { delete newDoc.cells[key] } else {
        const computed = computeCellValue(value, newDoc.cells);
        newDoc.cells[key] = { value, type: computed.type, style: newDoc.cells[key]?.style || {}, computedValue: computed.computedValue };
      }
      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document)); state.redoStack = []; state.document = newDoc;
    },
    updateCellStyle(state, action: PayloadAction<{ row: number; col: number; style: Partial<CellStyle> }>) {
      if (!state.document) return;
      const { row, col, style } = action.payload;
      const newDoc = cloneDocument(state.document);
      if (!newDoc.cells[cellKey(row, col)]) newDoc.cells[cellKey(row, col)] = { value: '', type: 'string', style: {}, computedValue: '' };
      newDoc.cells[cellKey(row, col)].style = { ...newDoc.cells[cellKey(row, col)].style, ...style };
      state.undoStack.push(cloneDocument(state.document)); state.redoStack = []; state.document = newDoc;
    },
    applyStyleToRange(state, action: PayloadAction<{ range: CellRange; style: Partial<CellStyle> }>) {
      if (!state.document) return;
      const { range, style } = action.payload;
      const newDoc = cloneDocument(state.document);
      for (let r = range.start.row; r <= range.end.row; r++)
        for (let c = range.start.col; c <= range.end.col; c++) {
          const key = cellKey(r, c);
          if (!newDoc.cells[key]) newDoc.cells[key] = { value: '', type: 'string', style: {}, computedValue: '' };
          newDoc.cells[key].style = { ...newDoc.cells[key].style, ...style };
        }
      state.undoStack.push(cloneDocument(state.document)); state.redoStack = []; state.document = newDoc;
    },
    copySelection(state) {
      if (!state.document || !state.selectedRange) return;
      state.clipboard = { range: state.selectedRange, data: getCellInRange(state.selectedRange, state.document.cells) };
    },
    cutSelection(state) {
      if (!state.document || !state.selectedRange) return;
      state.clipboard = { range: state.selectedRange, data: getCellInRange(state.selectedRange, state.document.cells) };
      const newDoc = cloneDocument(state.document);
      for (let r = state.selectedRange.start.row; r <= state.selectedRange.end.row; r++)
        for (let c = state.selectedRange.start.col; c <= state.selectedRange.end.col; c++)
          delete newDoc.cells[cellKey(r, c)];
      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document)); state.redoStack = []; state.document = newDoc;
    },
    pasteClipboard(state) {
      if (!state.document || !state.clipboard || !state.activeCell) return;
      const { data, range } = state.clipboard;
      const newDoc = cloneDocument(state.document);
      let hasData = false;
      for (const [key, cell] of Object.entries(data)) {
        const [rStr, cStr] = key.split('_');
        const r = parseInt(rStr) + state.activeCell.row - range.start.row;
        const c = parseInt(cStr) + state.activeCell.col - range.start.col;
        if (r < newDoc.rows && c < newDoc.cols) { newDoc.cells[cellKey(r, c)] = JSON.parse(JSON.stringify(cell)); hasData = true }
      }
      if (!hasData) return;
      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document)); state.redoStack = []; state.document = newDoc;
      state.selectedRange = { start: state.activeCell, end: { row: state.activeCell.row + (range.end.row - range.start.row), col: state.activeCell.col + (range.end.col - range.start.col) } };
    },
    deleteSelection(state) {
      if (!state.document || !state.selectedRange) return;
      const newDoc = cloneDocument(state.document);
      for (let r = state.selectedRange.start.row; r <= state.selectedRange.end.row; r++)
        for (let c = state.selectedRange.start.col; c <= state.selectedRange.end.col; c++)
          delete newDoc.cells[cellKey(r, c)];
      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document)); state.redoStack = []; state.document = newDoc;
    },
    undo(state) { if (state.undoStack.length === 0) return; const prev = state.undoStack.pop()!; state.redoStack.push(cloneDocument(state.document!)); state.document = prev },
    redo(state) { if (state.redoStack.length === 0) return; const next = state.redoStack.pop()!; state.undoStack.push(cloneDocument(state.document!)); state.document = next },
    insertRow(state, action: PayloadAction<number>) {
      if (!state.document) return;
      const rowIdx = action.payload;
      const newDoc = cloneDocument(state.document);
      const newCells: Record<string, CellData> = {};
      for (const [key, cell] of Object.entries(newDoc.cells)) {
        const [r, c] = key.split('_').map(Number);
        newCells[r >= rowIdx ? cellKey(r + 1, c) : key] = cell;
      }
      newDoc.cells = recomputeAllFormulas(newCells); newDoc.rows += 1;
      state.undoStack.push(cloneDocument(state.document)); state.redoStack = []; state.document = newDoc;
    },
    deleteRow(state, action: PayloadAction<number>) {
      if (!state.document || state.document.rows <= 1) return;
      const rowIdx = action.payload;
      const newDoc = cloneDocument(state.document);
      const newCells: Record<string, CellData> = {};
      for (const [key, cell] of Object.entries(newDoc.cells)) {
        const [r, c] = key.split('_').map(Number);
        if (r < rowIdx) newCells[key] = cell;
        else if (r > rowIdx) newCells[cellKey(r - 1, c)] = cell;
      }
      newDoc.cells = recomputeAllFormulas(newCells); newDoc.rows -= 1;
      state.undoStack.push(cloneDocument(state.document)); state.redoStack = []; state.document = newDoc;
    },
    insertColumn(state, action: PayloadAction<number>) {
      if (!state.document) return;
      const colIdx = action.payload;
      const newDoc = cloneDocument(state.document);
      const newCells: Record<string, CellData> = {};
      for (const [key, cell] of Object.entries(newDoc.cells)) {
        const [r, c] = key.split('_').map(Number);
        newCells[c >= colIdx ? cellKey(r, c + 1) : key] = cell;
      }
      newDoc.cells = recomputeAllFormulas(newCells); newDoc.cols += 1;
      state.undoStack.push(cloneDocument(state.document)); state.redoStack = []; state.document = newDoc;
    },
    deleteColumn(state, action: PayloadAction<number>) {
      if (!state.document || state.document.cols <= 1) return;
      const colIdx = action.payload;
      const newDoc = cloneDocument(state.document);
      const newCells: Record<string, CellData> = {};
      for (const [key, cell] of Object.entries(newDoc.cells)) {
        const [r, c] = key.split('_').map(Number);
        if (c < colIdx) newCells[key] = cell;
        else if (c > colIdx) newCells[cellKey(r, c - 1)] = cell;
      }
      newDoc.cells = recomputeAllFormulas(newCells); newDoc.cols -= 1;
      state.undoStack.push(cloneDocument(state.document)); state.redoStack = []; state.document = newDoc;
    },
    resizeColumn(state, action: PayloadAction<{ col: number; width: number }>) { if (!state.document) return; const newDoc = cloneDocument(state.document); newDoc.columnWidths[action.payload.col] = action.payload.width; state.document = newDoc },
    resizeRow(state, action: PayloadAction<{ row: number; height: number }>) { if (!state.document) return; const newDoc = cloneDocument(state.document); newDoc.rowHeights[action.payload.row] = action.payload.height; state.document = newDoc },
    selectAll(state) { if (!state.document) return; state.selectedRange = { start: { row: 0, col: 0 }, end: { row: state.document.rows - 1, col: state.document.cols - 1 } }; state.activeCell = { row: 0, col: 0 } },
    clearSpreadsheet() { return ssInitial },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDocument.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loadDocument.fulfilled, (state, action) => { state.loading = false; state.document = action.payload; state.undoStack = []; state.redoStack = []; state.activeCell = null; state.selectedRange = null; state.isEditing = false; state.editValue = null })
      .addCase(loadDocument.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed to load document' })
      .addCase(saveDocument.fulfilled, (state, action) => { state.document = action.payload });
  },
});

// ============ STORE CONFIG ============
export const store = configureStore({
  reducer: { spreadsheet: spreadsheetSlice.reducer, documents: documentsSlice.reducer, ui: uiSlice.reducer, auth: authSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const { logout, setMockUser, clearError } = authSlice.actions;
export const { clearDocuments } = documentsSlice.actions;
export const {
  setActiveCell, setSelectedRange, startEditing, setEditValue, commitEdit, cancelEdit,
  setCellValue, updateCellStyle, applyStyleToRange, copySelection, cutSelection, pasteClipboard,
  deleteSelection, undo, redo, insertRow, deleteRow, insertColumn, deleteColumn, resizeColumn, resizeRow, selectAll, clearSpreadsheet,
} = spreadsheetSlice.actions;
export const { setSaveStatus, showContextMenu, hideContextMenu, showNotification, hideNotification } = uiSlice.actions;
