import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UISliceState, SaveStatus } from '../../types';

const initialState: UISliceState = {
  saveStatus: 'saved',
  contextMenu: null,
  modal: null,
  notification: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSaveStatus(state, action: PayloadAction<SaveStatus>) {
      state.saveStatus = action.payload;
    },

    showContextMenu(state, action: PayloadAction<{ x: number; y: number; row: number; col: number }>) {
      state.contextMenu = action.payload;
    },

    hideContextMenu(state) {
      state.contextMenu = null;
    },

    showModal(state, action: PayloadAction<{ type: string; props?: Record<string, unknown> }>) {
      state.modal = action.payload;
    },

    hideModal(state) {
      state.modal = null;
    },

    showNotification(state, action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' }>) {
      state.notification = action.payload;
    },

    hideNotification(state) {
      state.notification = null;
    },
  },
});

export const {
  setSaveStatus,
  showContextMenu,
  hideContextMenu,
  showModal,
  hideModal,
  showNotification,
  hideNotification,
} = uiSlice.actions;

export default uiSlice.reducer;
