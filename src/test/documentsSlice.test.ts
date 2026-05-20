import { describe, it, expect } from 'vitest';
import documentsReducer, {
  fetchDocuments,
  createDocument,
  deleteDocument,
  renameDocument,
  duplicateDocument,
  clearDocuments,
} from '../store/slices/documentsSlice';
import type { DocumentsState, DocumentMeta } from '../types';

const initialState: DocumentsState = {
  documents: [],
  loading: false,
  error: null,
};

const mockDoc: DocumentMeta = {
  id: 'doc_1',
  name: 'Test',
  userId: 'user_1',
  rows: 5,
  cols: 3,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  preview: [],
};

describe('documentsSlice', () => {
  it('should return initial state', () => {
    expect(documentsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle fetchDocuments.pending', () => {
    const next = documentsReducer(initialState, fetchDocuments.pending('', 'user_1'));
    expect(next.loading).toBe(true);
    expect(next.error).toBeNull();
  });

  it('should handle fetchDocuments.fulfilled', () => {
    const docs = [mockDoc];
    const next = documentsReducer(initialState, fetchDocuments.fulfilled(docs, '', 'user_1'));
    expect(next.loading).toBe(false);
    expect(next.documents).toEqual(docs);
  });

  it('should handle createDocument.fulfilled', () => {
    const action = createDocument.fulfilled(
      { id: 'new', name: 'New Doc', userId: 'u1', rows: 10, cols: 5, cells: {}, columnWidths: {}, rowHeights: {}, createdAt: 'now', updatedAt: 'now' },
      '',
      { userId: 'u1', name: 'New Doc', rows: 10, cols: 5 },
    );
    const next = documentsReducer(initialState, action);
    expect(next.documents).toHaveLength(1);
    expect(next.documents[0].name).toBe('New Doc');
  });

  it('should handle deleteDocument.fulfilled', () => {
    const withDoc: DocumentsState = { ...initialState, documents: [mockDoc] };
    const next = documentsReducer(withDoc, deleteDocument.fulfilled('doc_1', '', 'doc_1'));
    expect(next.documents).toHaveLength(0);
  });

  it('should handle renameDocument.fulfilled', () => {
    const withDoc: DocumentsState = { ...initialState, documents: [mockDoc] };
    const next = documentsReducer(withDoc, renameDocument.fulfilled({ id: 'doc_1', name: 'Renamed' }, '', { id: 'doc_1', name: 'Renamed' }));
    expect(next.documents[0].name).toBe('Renamed');
  });

  it('should handle duplicateDocument.fulfilled', () => {
    const action = duplicateDocument.fulfilled(
      { id: 'dup', name: 'Test (Copy)', userId: 'u1', rows: 5, cols: 3, cells: {}, columnWidths: {}, rowHeights: {}, createdAt: 'now', updatedAt: 'now' },
      '',
      'doc_1',
    );
    const withDoc: DocumentsState = { ...initialState, documents: [mockDoc] };
    const next = documentsReducer(withDoc, action);
    expect(next.documents).toHaveLength(2);
    expect(next.documents[0].name).toBe('Test (Copy)');
  });

  it('should clear documents', () => {
    const withDoc: DocumentsState = { ...initialState, documents: [mockDoc] };
    const next = documentsReducer(withDoc, clearDocuments());
    expect(next.documents).toHaveLength(0);
  });
});
