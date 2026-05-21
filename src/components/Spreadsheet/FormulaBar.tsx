import { useAppDispatch, useAppSelector, setEditValue, commitEdit, startEditing, cancelEdit } from '../../store';

function colLabel(index: number): string {
  let label = '', n = index;
  while (n >= 0) { label = String.fromCharCode(65 + (n % 26)) + label; n = Math.floor(n / 26) - 1 }
  return label;
}

function cellRefString(row: number, col: number): string { return `${colLabel(col)}${row + 1}` }

export function FormulaBar() {
  const dispatch = useAppDispatch();
  const { activeCell, editValue, isEditing, document } = useAppSelector((s) => s.spreadsheet);
  const cellRef = activeCell ? cellRefString(activeCell.row, activeCell.col) : '';
  const cellContent = activeCell && document ? document.cells[`${activeCell.row}_${activeCell.col}`]?.value || '' : '';
  const displayValue = isEditing ? editValue : cellContent;

  return (
    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc', padding: '2px 4px', background: '#fafafa' }}>
      <div style={{ width: 60, padding: '2px 8px', border: '1px solid #ccc', background: '#fff', textAlign: 'center', fontSize: 12, marginRight: 4, fontWeight: 600 }}>{cellRef}</div>
      <div style={{ width: 20, textAlign: 'center', color: '#666', fontSize: 14 }}>fx</div>
      <input value={displayValue ?? ''}
        onChange={(e) => { if (!isEditing) dispatch(startEditing()); dispatch(setEditValue(e.target.value)) }}
        onKeyDown={(e) => { if (e.key === 'Enter') dispatch(commitEdit()); else if (e.key === 'Escape') dispatch(cancelEdit()) }}
        onFocus={() => { if (!isEditing && activeCell) dispatch(startEditing()) }}
        style={{ flex: 1, border: '1px solid #ccc', padding: '2px 8px', fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
        placeholder="Enter value or formula" />
    </div>
  );
}
