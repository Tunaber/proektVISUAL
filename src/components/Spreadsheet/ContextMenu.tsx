import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector, hideContextMenu, insertRow, deleteRow, insertColumn, deleteColumn } from '../../store';

export function ContextMenu() {
  const dispatch = useAppDispatch();
  const contextMenu = useAppSelector((s) => s.ui.contextMenu);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => dispatch(hideContextMenu());
    if (contextMenu) window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  if (!contextMenu) return null;
  const { x, y, row, col } = contextMenu;

  return (
    <div ref={ref} style={{ position: 'fixed', left: x, top: y, background: '#fff', border: '1px solid #ccc', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 1000, minWidth: 160, padding: '4px 0' }}>
      <div onClick={() => { dispatch(insertRow(row + 1)); dispatch(hideContextMenu()) }} style={mi}>Insert row below</div>
      <div onClick={() => { dispatch(insertRow(row)); dispatch(hideContextMenu()) }} style={mi}>Insert row above</div>
      <div onClick={() => { dispatch(deleteRow(row)); dispatch(hideContextMenu()) }} style={mi}>Delete row</div>
      <div style={{ height: 1, background: '#e0e0e0', margin: '4px 0' }} />
      <div onClick={() => { dispatch(insertColumn(col + 1)); dispatch(hideContextMenu()) }} style={mi}>Insert column right</div>
      <div onClick={() => { dispatch(insertColumn(col)); dispatch(hideContextMenu()) }} style={mi}>Insert column left</div>
      <div onClick={() => { dispatch(deleteColumn(col)); dispatch(hideContextMenu()) }} style={mi}>Delete column</div>
    </div>
  );
}

const mi: React.CSSProperties = { padding: '6px 16px', cursor: 'pointer', fontSize: 13, userSelect: 'none' };
