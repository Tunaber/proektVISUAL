import { describe, it, expect, beforeEach } from 'vitest';
import spreadsheetReducer, {
  setActiveCell,
  setCellValue,
  updateCellStyle,
  undo,
  redo,
  insertRow,
  deleteRow,
  insertColumn,
  deleteColumn,
  copySelection,
  cutSelection,
  pasteClipboard,
  deleteSelection,
  clearSpreadsheet,
} from '../store/slices/spreadsheetSlice';
import type { SpreadsheetState, DocumentData } from '../types';

function createMockDoc(overrides?: Partial<DocumentData>): DocumentData {
  return {
    id: 'test_doc',
    name: 'Test',
    userId: 'user_1',
    rows: 5,
    cols: 3,
    cells: {},
    columnWidths: {},
    rowHeights: {},
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
  };
}

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

describe('spreadsheetSlice', () => {
  let state: SpreadsheetState;

  beforeEach(() => {
    state = { ...initialState, document: createMockDoc() };
  });

  it('should set active cell', () => {
    const next = spreadsheetReducer(state, setActiveCell({ row: 2, col: 1 }));
    expect(next.activeCell).toEqual({ row: 2, col: 1 });
    expect(next.selectedRange).toEqual({ start: { row: 2, col: 1 }, end: { row: 2, col: 1 } });
  });

  it('should set cell value', () => {
    const next = spreadsheetReducer(state, setCellValue({ row: 0, col: 0, value: '42' }));
    expect(next.document?.cells['0_0']?.value).toBe('42');
    expect(next.document?.cells['0_0']?.type).toBe('number');
    expect(next.document?.cells['0_0']?.computedValue).toBe(42);
  });

  it('should set string cell value', () => {
    const next = spreadsheetReducer(state, setCellValue({ row: 0, col: 0, value: 'hello' }));
    expect(next.document?.cells['0_0']?.value).toBe('hello');
    expect(next.document?.cells['0_0']?.type).toBe('string');
  });

  it('should evaluate formula', () => {
    let next = spreadsheetReducer(state, setCellValue({ row: 0, col: 0, value: '10' }));
    next = spreadsheetReducer(next, setCellValue({ row: 0, col: 1, value: '20' }));
    next = spreadsheetReducer(next, setCellValue({ row: 0, col: 2, value: '=A1+B1' }));
    expect(next.document?.cells['0_2']?.computedValue).toBe(30);
  });

  it('should evaluate SUM formula', () => {
    let next = spreadsheetReducer(state, setCellValue({ row: 0, col: 0, value: '1' }));
    next = spreadsheetReducer(next, setCellValue({ row: 1, col: 0, value: '2' }));
    next = spreadsheetReducer(next, setCellValue({ row: 2, col: 0, value: '3' }));
    next = spreadsheetReducer(next, setCellValue({ row: 3, col: 0, value: '=SUM(A1:A3)' }));
    expect(next.document?.cells['3_0']?.computedValue).toBe(6);
  });

  it('should support undo', () => {
    const next = spreadsheetReducer(state, setCellValue({ row: 0, col: 0, value: 'test' }));
    expect(next.document?.cells['0_0']?.value).toBe('test');
    const undone = spreadsheetReducer(next, undo());
    expect(undone.document?.cells['0_0']).toBeUndefined();
  });

  it('should support redo', () => {
    const next = spreadsheetReducer(state, setCellValue({ row: 0, col: 0, value: 'test' }));
    const undone = spreadsheetReducer(next, undo());
    expect(undone.document?.cells['0_0']).toBeUndefined();
    const redone = spreadsheetReducer(undone, redo());
    expect(redone.document?.cells['0_0']?.value).toBe('test');
  });

  it('should update cell style', () => {
    const next = spreadsheetReducer(
      state,
      updateCellStyle({ row: 0, col: 0, style: { bold: true, color: '#ff0000' } }),
    );
    expect(next.document?.cells['0_0']?.style.bold).toBe(true);
    expect(next.document?.cells['0_0']?.style.color).toBe('#ff0000');
  });

  it('should insert row', () => {
    let next = spreadsheetReducer(state, setCellValue({ row: 2, col: 0, value: 'moved' }));
    next = spreadsheetReducer(next, insertRow(1));
    expect(next.document?.rows).toBe(6);
    expect(next.document?.cells['3_0']?.value).toBe('moved');
    expect(next.document?.cells['1_0']).toBeUndefined();
  });

  it('should delete row', () => {
    let next = spreadsheetReducer(state, setCellValue({ row: 2, col: 0, value: 'will move to 1' }));
    next = spreadsheetReducer(next, deleteRow(0));
    expect(next.document?.rows).toBe(4);
    expect(next.document?.cells['1_0']?.value).toBe('will move to 1');
  });

  it('should insert column', () => {
    let next = spreadsheetReducer(state, setCellValue({ row: 0, col: 1, value: 'moved' }));
    next = spreadsheetReducer(next, insertColumn(0));
    expect(next.document?.cols).toBe(4);
    expect(next.document?.cells['0_2']?.value).toBe('moved');
  });

  it('should delete column', () => {
    let next = spreadsheetReducer(state, setCellValue({ row: 0, col: 2, value: 'will move' }));
    next = spreadsheetReducer(next, deleteColumn(1));
    expect(next.document?.cols).toBe(2);
    expect(next.document?.cells['0_1']?.value).toBe('will move');
  });

  it('should copy, cut, and paste', () => {
    let next = spreadsheetReducer(state, setCellValue({ row: 0, col: 0, value: 'data' }));
    next = spreadsheetReducer(next, setActiveCell({ row: 0, col: 0 }));
    next = spreadsheetReducer(next, copySelection());
    expect(next.clipboard).not.toBeNull();

    next = spreadsheetReducer(next, setActiveCell({ row: 2, col: 2 }));
    next = spreadsheetReducer(next, pasteClipboard());
    expect(next.document?.cells['2_2']?.value).toBe('data');
  });

  it('should cut selection', () => {
    let next = spreadsheetReducer(state, setCellValue({ row: 0, col: 0, value: 'cut me' }));
    next = spreadsheetReducer(next, setActiveCell({ row: 0, col: 0 }));
    next = spreadsheetReducer(next, cutSelection());
    expect(next.document?.cells['0_0']).toBeUndefined();
    expect(next.clipboard).not.toBeNull();
  });

  it('should delete selection', () => {
    let next = spreadsheetReducer(state, setCellValue({ row: 0, col: 0, value: 'delete' }));
    next = spreadsheetReducer(next, setCellValue({ row: 1, col: 0, value: 'keep' }));
    next = spreadsheetReducer(next, setActiveCell({ row: 0, col: 0 }));
    next = spreadsheetReducer(next, deleteSelection());
    expect(next.document?.cells['0_0']).toBeUndefined();
    expect(next.document?.cells['1_0']?.value).toBe('keep');
  });

  it('should clear spreadsheet', () => {
    const next = spreadsheetReducer(state, clearSpreadsheet());
    expect(next.document).toBeNull();
    expect(next.activeCell).toBeNull();
  });
});
