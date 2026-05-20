import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { DocumentsState, DocumentData } from '../../types';
import { api } from '../../services/api';

const initialState: DocumentsState = {
  documents: [],
  loading: false,
  error: null,
};

export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (userId: string) => {
    return api.getDocuments(userId);
  },
);

export const createDocument = createAsyncThunk(
  'documents/createDocument',
  async ({ userId, name, rows, cols }: { userId: string; name: string; rows: number; cols: number }) => {
    return api.createDocument(userId, name, rows, cols);
  },
);

export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (id: string) => {
    await api.deleteDocument(id);
    return id;
  },
);

export const duplicateDocument = createAsyncThunk(
  'documents/duplicateDocument',
  async (id: string) => {
    return api.duplicateDocument(id);
  },
);

export const renameDocument = createAsyncThunk(
  'documents/renameDocument',
  async ({ id, name }: { id: string; name: string }) => {
    await api.renameDocument(id, name);
    return { id, name };
  },
);

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearDocuments(state) {
      state.documents = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch documents';
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.documents.unshift({
          id: action.payload.id,
          name: action.payload.name,
          userId: action.payload.userId,
          rows: action.payload.rows,
          cols: Math.min(action.payload.cols, 3),
          createdAt: action.payload.createdAt,
          updatedAt: action.payload.updatedAt,
          preview: [],
        });
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter((d) => d.id !== action.payload);
      })
      .addCase(duplicateDocument.fulfilled, (state, action) => {
        const doc = action.payload;
        state.documents.unshift({
          id: doc.id,
          name: doc.name,
          userId: doc.userId,
          rows: doc.rows,
          cols: Math.min(doc.cols, 3),
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          preview: [],
        });
      })
      .addCase(renameDocument.fulfilled, (state, action) => {
        const doc = state.documents.find((d) => d.id === action.payload.id);
        if (doc) doc.name = action.payload.name;
      });
  },
});

export const { clearDocuments } = documentsSlice.actions;
export default documentsSlice.reducer;
