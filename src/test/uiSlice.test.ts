import { describe, it, expect } from 'vitest';
import uiReducer, {
  setSaveStatus,
  showContextMenu,
  hideContextMenu,
  showModal,
  hideModal,
  showNotification,
  hideNotification,
} from '../store/slices/uiSlice';
import type { UISliceState } from '../types';

const initialState: UISliceState = {
  saveStatus: 'saved',
  contextMenu: null,
  modal: null,
  notification: null,
};

describe('uiSlice', () => {
  it('should return initial state', () => {
    expect(uiReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should set save status', () => {
    expect(uiReducer(initialState, setSaveStatus('saving')).saveStatus).toBe('saving');
    expect(uiReducer(initialState, setSaveStatus('error')).saveStatus).toBe('error');
    expect(uiReducer(initialState, setSaveStatus('saved')).saveStatus).toBe('saved');
  });

  it('should show/hide context menu', () => {
    const shown = uiReducer(initialState, showContextMenu({ x: 100, y: 200, row: 1, col: 2 }));
    expect(shown.contextMenu).toEqual({ x: 100, y: 200, row: 1, col: 2 });
    const hidden = uiReducer(shown, hideContextMenu());
    expect(hidden.contextMenu).toBeNull();
  });

  it('should show/hide modal', () => {
    const shown = uiReducer(initialState, showModal({ type: 'createDoc', props: { foo: 'bar' } }));
    expect(shown.modal).toEqual({ type: 'createDoc', props: { foo: 'bar' } });
    const hidden = uiReducer(shown, hideModal());
    expect(hidden.modal).toBeNull();
  });

  it('should show/hide notification', () => {
    const shown = uiReducer(initialState, showNotification({ message: 'Saved', type: 'success' }));
    expect(shown.notification).toEqual({ message: 'Saved', type: 'success' });
    const hidden = uiReducer(shown, hideNotification());
    expect(hidden.notification).toBeNull();
  });
});
