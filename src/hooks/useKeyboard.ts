import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  startEditing,
  commitEdit,
  cancelEdit,
  setActiveCell,
  copySelection,
  cutSelection,
  pasteClipboard,
  deleteSelection,
  undo,
  redo,
  selectAll,
  setEditValue,
} from '../store/slices/spreadsheetSlice';
import { saveDocument } from '../store/slices/spreadsheetSlice';
import { setSaveStatus } from '../store/slices/uiSlice';

const MIN_ROW = 0;
const MIN_COL = 0;

export function useKeyboard() {
  const dispatch = useAppDispatch();
  const { document, activeCell, isEditing, editValue, selectedRange } = useAppSelector(
    (s) => s.spreadsheet,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (document) {
          dispatch(setSaveStatus('saving'));
          dispatch(saveDocument(document))
            .unwrap()
            .then(() => dispatch(setSaveStatus('saved')))
            .catch(() => dispatch(setSaveStatus('error')));
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          dispatch(redo());
        } else {
          dispatch(undo());
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        dispatch(redo());
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        dispatch(copySelection());
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        dispatch(cutSelection());
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        dispatch(pasteClipboard());
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        dispatch(selectAll());
        return;
      }

      if (!activeCell || !document) return;
      const { row, col } = activeCell;
      const maxRow = document.rows - 1;
      const maxCol = document.cols - 1;

      if (isEditing) {
        if (e.key === 'Enter') {
          e.preventDefault();
          dispatch(commitEdit());
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          dispatch(cancelEdit());
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          dispatch(commitEdit());
          dispatch(setActiveCell({ row, col: Math.min(col + 1, maxCol) }));
          return;
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const key = `${activeCell.row}_${activeCell.col}`;
        const cell = document.cells[key];
        dispatch(setEditValue(cell?.value || ''));
        dispatch(startEditing());
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const nextCol = e.shiftKey ? Math.max(col - 1, MIN_COL) : Math.min(col + 1, maxCol);
        dispatch(setActiveCell({ row, col: nextCol }));
        return;
      }

      if (e.key === 'Escape') {
        dispatch(setActiveCell(null));
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        dispatch(deleteSelection());
        return;
      }

      const arrowActions: Record<string, { row: number; col: number }> = {
        ArrowUp: { row: Math.max(row - 1, MIN_ROW), col },
        ArrowDown: { row: Math.min(row + 1, maxRow), col },
        ArrowLeft: { row, col: Math.max(col - 1, MIN_COL) },
        ArrowRight: { row, col: Math.min(col + 1, maxCol) },
      };

      if (arrowActions[e.key]) {
        e.preventDefault();
        if (e.shiftKey && selectedRange) {
          const newRange = { ...selectedRange };
          if (e.key === 'ArrowDown') newRange.end = { row: Math.min(row + 1, maxRow), col };
          else if (e.key === 'ArrowUp') {
            if (row > selectedRange.start.row) newRange.end = { row: row - 1, col };
            else newRange.start = { row: Math.max(row - 1, 0), col };
          } else if (e.key === 'ArrowRight') newRange.end = { row, col: Math.min(col + 1, maxCol) };
          else if (e.key === 'ArrowLeft') {
            if (col > selectedRange.start.col) newRange.end = { row, col: col - 1 };
            else newRange.start = { row, col: Math.max(col - 1, 0) };
          }
          dispatch(setActiveCell(arrowActions[e.key]));
        } else {
          dispatch(setActiveCell(arrowActions[e.key]));
        }
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        dispatch(setEditValue(e.key));
        dispatch(startEditing());
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, document, activeCell, isEditing, editValue, selectedRange]);
}
