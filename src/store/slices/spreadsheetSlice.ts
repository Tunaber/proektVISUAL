import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { SpreadsheetState, CellData, CellPosition, CellRange, DocumentData, CellStyle } from '../../types';
import { cellKey, computeCellValue, cloneDocument, getCellInRange } from '../../utils/spreadsheet';
import { api } from '../../services/api';

const initialState: SpreadsheetState = {
  document: null,
  activeCell: null,
  selectedRange: null,
  editValue: null,
  isEditing: false,
  clipboard: null,
  undoStack: [],
  redoStack: [],
  loading: false,
  error: null,
};

export const loadDocument = createAsyncThunk(
  'spreadsheet/loadDocument',
  async (id: string) => {
    const doc = await api.getDocument(id);
    if (!doc) throw new Error('Document not found');
    return doc;
  },
);

export const saveDocument = createAsyncThunk(
  'spreadsheet/saveDocument',
  async (doc: DocumentData) => {
    await api.updateDocument(doc.id, { cells: doc.cells, columnWidths: doc.columnWidths, rowHeights: doc.rowHeights, name: doc.name });
    return doc;
  },
);

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    setActiveCell(state, action: PayloadAction<CellPosition | null>) {
      state.activeCell = action.payload;
      if (action.payload) {
        state.selectedRange = { start: action.payload, end: action.payload };
      }
    },

    setSelectedRange(state, action: PayloadAction<CellRange | null>) {
      state.selectedRange = action.payload;
    },

    startEditing(state) {
      if (state.activeCell && state.document) {
        state.isEditing = true;
        const key = cellKey(state.activeCell.row, state.activeCell.col);
        state.editValue = state.document.cells[key]?.value || '';
      }
    },

    setEditValue(state, action: PayloadAction<string>) {
      state.editValue = action.payload;
    },

    commitEdit(state) {
      if (!state.activeCell || !state.document || state.editValue === null) return;
      state.isEditing = false;
      const { row, col } = state.activeCell;
      const key = cellKey(row, col);
      const newDoc = cloneDocument(state.document);
      const value = state.editValue;

      if (value === '') {
        delete newDoc.cells[key];
      } else {
        const computed = computeCellValue(value, newDoc.cells);
        newDoc.cells[key] = {
          value,
          type: computed.type,
          style: newDoc.cells[key]?.style || {},
          computedValue: computed.computedValue,
        };
      }

      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document));
      state.redoStack = [];
      state.document = newDoc;
      state.editValue = null;
    },

    cancelEdit(state) {
      state.isEditing = false;
      state.editValue = null;
    },

    setCellValue(state, action: PayloadAction<{ row: number; col: number; value: string }>) {
      if (!state.document) return;
      const { row, col, value } = action.payload;
      const key = cellKey(row, col);
      const newDoc = cloneDocument(state.document);

      if (value === '') {
        delete newDoc.cells[key];
      } else {
        const computed = computeCellValue(value, newDoc.cells);
        newDoc.cells[key] = {
          value,
          type: computed.type,
          style: newDoc.cells[key]?.style || {},
          computedValue: computed.computedValue,
        };
      }

      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document));
      state.redoStack = [];
      state.document = newDoc;
    },

    updateCellStyle(state, action: PayloadAction<{ row: number; col: number; style: Partial<CellStyle> }>) {
      if (!state.document) return;
      const { row, col, style } = action.payload;
      const key = cellKey(row, col);
      const newDoc = cloneDocument(state.document);
      if (!newDoc.cells[key]) {
        newDoc.cells[key] = { value: '', type: 'string', style: {}, computedValue: '' };
      }
      newDoc.cells[key].style = { ...newDoc.cells[key].style, ...style };
      state.undoStack.push(cloneDocument(state.document));
      state.redoStack = [];
      state.document = newDoc;
    },

    applyStyleToRange(state, action: PayloadAction<{ range: CellRange; style: Partial<CellStyle> }>) {
      if (!state.document) return;
      const { range, style } = action.payload;
      const newDoc = cloneDocument(state.document);
      for (let r = range.start.row; r <= range.end.row; r++) {
        for (let c = range.start.col; c <= range.end.col; c++) {
          const key = cellKey(r, c);
          if (!newDoc.cells[key]) {
            newDoc.cells[key] = { value: '', type: 'string', style: {}, computedValue: '' };
          }
          newDoc.cells[key].style = { ...newDoc.cells[key].style, ...style };
        }
      }
      state.undoStack.push(cloneDocument(state.document));
      state.redoStack = [];
      state.document = newDoc;
    },

    copySelection(state) {
      if (!state.document || !state.selectedRange) return;
      const data = getCellInRange(state.selectedRange, state.document.cells);
      state.clipboard = { range: state.selectedRange, data };
    },

    cutSelection(state) {
      if (!state.document || !state.selectedRange) return;
      const data = getCellInRange(state.selectedRange, state.document.cells);
      state.clipboard = { range: state.selectedRange, data };
      const newDoc = cloneDocument(state.document);
      for (let r = state.selectedRange.start.row; r <= state.selectedRange.end.row; r++) {
        for (let c = state.selectedRange.start.col; c <= state.selectedRange.end.col; c++) {
          delete newDoc.cells[cellKey(r, c)];
        }
      }
      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document));
      state.redoStack = [];
      state.document = newDoc;
    },

    pasteClipboard(state) {
      if (!state.document || !state.clipboard || !state.activeCell) return;
      const { data, range } = state.clipboard;
      const height = range.end.row - range.start.row;
      const width = range.end.col - range.start.col;
      const newDoc = cloneDocument(state.document);
      let hasData = false;
      for (const [key, cell] of Object.entries(data)) {
        const [rStr, cStr] = key.split('_');
        const r = parseInt(rStr) + state.activeCell.row - range.start.row;
        const c = parseInt(cStr) + state.activeCell.col - range.start.col;
        if (r < newDoc.rows && c < newDoc.cols) {
          const newKey = cellKey(r, c);
          newDoc.cells[newKey] = JSON.parse(JSON.stringify(cell));
          hasData = true;
        }
      }
      if (!hasData) return;
      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document));
      state.redoStack = [];
      state.document = newDoc;
      state.selectedRange = {
        start: state.activeCell,
        end: { row: state.activeCell.row + height, col: state.activeCell.col + width },
      };
    },

    deleteSelection(state) {
      if (!state.document || !state.selectedRange) return;
      const newDoc = cloneDocument(state.document);
      for (let r = state.selectedRange.start.row; r <= state.selectedRange.end.row; r++) {
        for (let c = state.selectedRange.start.col; c <= state.selectedRange.end.col; c++) {
          delete newDoc.cells[cellKey(r, c)];
        }
      }
      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document));
      state.redoStack = [];
      state.document = newDoc;
    },

    undo(state) {
      if (state.undoStack.length === 0) return;
      const prev = state.undoStack.pop()!;
      state.redoStack.push(cloneDocument(state.document!));
      state.document = prev;
    },

    redo(state) {
      if (state.redoStack.length === 0) return;
      const next = state.redoStack.pop()!;
      state.undoStack.push(cloneDocument(state.document!));
      state.document = next;
    },

    insertRow(state, action: PayloadAction<number>) {
      if (!state.document) return;
      const rowIdx = action.payload;
      const newDoc = cloneDocument(state.document);
      const newCells: Record<string, CellData> = {};
      for (const [key, cell] of Object.entries(newDoc.cells)) {
        const [r, c] = key.split('_').map(Number);
        if (r >= rowIdx) {
          newCells[cellKey(r + 1, c)] = cell;
        } else {
          newCells[key] = cell;
        }
      }
      newDoc.cells = newCells;
      newDoc.rows += 1;
      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document));
      state.redoStack = [];
      state.document = newDoc;
    },

    deleteRow(state, action: PayloadAction<number>) {
      if (!state.document || state.document.rows <= 1) return;
      const rowIdx = action.payload;
      const newDoc = cloneDocument(state.document);
      const newCells: Record<string, CellData> = {};
      for (const [key, cell] of Object.entries(newDoc.cells)) {
        const [r, c] = key.split('_').map(Number);
        if (r < rowIdx) {
          newCells[key] = cell;
        } else if (r > rowIdx) {
          newCells[cellKey(r - 1, c)] = cell;
        }
      }
      newDoc.cells = newCells;
      newDoc.rows -= 1;
      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document));
      state.redoStack = [];
      state.document = newDoc;
    },

    insertColumn(state, action: PayloadAction<number>) {
      if (!state.document) return;
      const colIdx = action.payload;
      const newDoc = cloneDocument(state.document);
      const newCells: Record<string, CellData> = {};
      for (const [key, cell] of Object.entries(newDoc.cells)) {
        const [r, c] = key.split('_').map(Number);
        if (c >= colIdx) {
          newCells[cellKey(r, c + 1)] = cell;
        } else {
          newCells[key] = cell;
        }
      }
      newDoc.cells = newCells;
      newDoc.cols += 1;
      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document));
      state.redoStack = [];
      state.document = newDoc;
    },

    deleteColumn(state, action: PayloadAction<number>) {
      if (!state.document || state.document.cols <= 1) return;
      const colIdx = action.payload;
      const newDoc = cloneDocument(state.document);
      const newCells: Record<string, CellData> = {};
      for (const [key, cell] of Object.entries(newDoc.cells)) {
        const [r, c] = key.split('_').map(Number);
        if (c < colIdx) {
          newCells[key] = cell;
        } else if (c > colIdx) {
          newCells[cellKey(r, c - 1)] = cell;
        }
      }
      newDoc.cells = newCells;
      newDoc.cols -= 1;
      newDoc.cells = recomputeAllFormulas(newDoc.cells);
      state.undoStack.push(cloneDocument(state.document));
      state.redoStack = [];
      state.document = newDoc;
    },

    resizeColumn(state, action: PayloadAction<{ col: number; width: number }>) {
      if (!state.document) return;
      const newDoc = cloneDocument(state.document);
      newDoc.columnWidths[action.payload.col] = action.payload.width;
      state.document = newDoc;
    },

    resizeRow(state, action: PayloadAction<{ row: number; height: number }>) {
      if (!state.document) return;
      const newDoc = cloneDocument(state.document);
      newDoc.rowHeights[action.payload.row] = action.payload.height;
      state.document = newDoc;
    },

    selectAll(state) {
      if (!state.document) return;
      state.selectedRange = {
        start: { row: 0, col: 0 },
        end: { row: state.document.rows - 1, col: state.document.cols - 1 },
      };
      state.activeCell = { row: 0, col: 0 };
    },

    clearSpreadsheet() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.document = action.payload;
        state.undoStack = [];
        state.redoStack = [];
        state.activeCell = null;
        state.selectedRange = null;
        state.isEditing = false;
        state.editValue = null;
      })
      .addCase(loadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load document';
      })
      .addCase(saveDocument.pending, (state) => {
        // saving status handled by uiSlice
      })
      .addCase(saveDocument.fulfilled, (state, action) => {
        state.document = action.payload;
      });
  },
});

function recomputeAllFormulas(cells: Record<string, CellData>): Record<string, CellData> {
  const result = { ...cells };
  const formulaCells = Object.entries(result).filter(([, cell]) => cell.type === 'formula');
  for (const [key, cell] of formulaCells) {
    const computed = computeCellValue(cell.value, result);
    result[key] = { ...cell, ...computed };
  }
  return result;
}

export const {
  setActiveCell,
  setSelectedRange,
  startEditing,
  setEditValue,
  commitEdit,
  cancelEdit,
  setCellValue,
  updateCellStyle,
  applyStyleToRange,
  copySelection,
  cutSelection,
  pasteClipboard,
  deleteSelection,
  undo,
  redo,
  insertRow,
  deleteRow,
  insertColumn,
  deleteColumn,
  resizeColumn,
  resizeRow,
  selectAll,
  clearSpreadsheet,
} = spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;
