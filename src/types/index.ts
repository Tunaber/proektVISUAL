export type CellType = 'string' | 'number' | 'boolean' | 'formula';

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  numberFormat?: 'number' | 'percent' | 'currency' | 'date';
}

export interface CellData {
  value: string;
  type: CellType;
  style: CellStyle;
  computedValue?: string | number | boolean;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

export interface DocumentData {
  id: string;
  name: string;
  userId: string;
  rows: number;
  cols: number;
  cells: Record<string, CellData>;
  columnWidths: Record<number, number>;
  rowHeights: Record<number, number>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMeta {
  id: string;
  name: string;
  userId: string;
  rows: number;
  cols: number;
  createdAt: string;
  updatedAt: string;
  preview: string[][];
}

export type SaveStatus = 'saved' | 'saving' | 'error';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface SpreadsheetState {
  document: DocumentData | null;
  activeCell: CellPosition | null;
  selectedRange: CellRange | null;
  editValue: string | null;
  isEditing: boolean;
  clipboard: { range: CellRange; data: Record<string, CellData> } | null;
  undoStack: DocumentData[];
  redoStack: DocumentData[];
  loading: boolean;
  error: string | null;
}

export interface UISliceState {
  saveStatus: SaveStatus;
  contextMenu: { x: number; y: number; row: number; col: number } | null;
  modal: { type: string; props?: Record<string, unknown> } | null;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
}

export interface DocumentsState {
  documents: DocumentMeta[];
  loading: boolean;
  error: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}
