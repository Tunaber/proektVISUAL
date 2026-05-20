import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setEditValue, commitEdit, startEditing, cancelEdit } from '../../store/slices/spreadsheetSlice';
import { cellRefString } from '../../utils/spreadsheet';

export function FormulaBar() {
  const dispatch = useAppDispatch();
  const { activeCell, editValue, isEditing, document } = useAppSelector((s) => s.spreadsheet);

  const cellRef = activeCell ? cellRefString(activeCell.row, activeCell.col) : '';

  const cellContent = activeCell && document
    ? document.cells[`${activeCell.row}_${activeCell.col}`]?.value || ''
    : '';

  const displayValue = isEditing ? editValue : cellContent;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isEditing) {
        dispatch(startEditing());
      }
      dispatch(setEditValue(e.target.value));
    },
    [dispatch, isEditing],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        dispatch(commitEdit());
      } else if (e.key === 'Escape') {
        dispatch(cancelEdit());
      }
    },
    [dispatch],
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc', padding: '2px 4px', background: '#fafafa' }}>
      <div
        style={{
          width: 60,
          padding: '2px 8px',
          border: '1px solid #ccc',
          background: '#fff',
          textAlign: 'center',
          fontSize: 12,
          marginRight: 4,
          fontWeight: 600,
        }}
      >
        {cellRef}
      </div>
      <div style={{ width: 20, textAlign: 'center', color: '#666', fontSize: 14 }}>fx</div>
      <input
        value={displayValue ?? ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (!isEditing && activeCell) {
            dispatch(startEditing());
          }
        }}
        style={{
          flex: 1,
          border: '1px solid #ccc',
          padding: '2px 8px',
          fontSize: 13,
          outline: 'none',
          fontFamily: 'monospace',
        }}
        placeholder="Enter value or formula"
      />
    </div>
  );
}
