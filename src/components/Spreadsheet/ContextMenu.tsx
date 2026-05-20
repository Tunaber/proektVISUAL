import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { hideContextMenu } from '../../store/slices/uiSlice';
import { insertRow, deleteRow, insertColumn, deleteColumn } from '../../store/slices/spreadsheetSlice';

export function ContextMenu() {
  const dispatch = useAppDispatch();
  const contextMenu = useAppSelector((s) => s.ui.contextMenu);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => dispatch(hideContextMenu());
    if (contextMenu) {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu, dispatch]);

  if (!contextMenu) return null;

  const { row, col } = contextMenu;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: 160,
        padding: '4px 0',
      }}
    >
      <MenuItem onClick={() => { dispatch(insertRow(row + 1)); dispatch(hideContextMenu()); }}>
        Insert row below
      </MenuItem>
      <MenuItem onClick={() => { dispatch(insertRow(row)); dispatch(hideContextMenu()); }}>
        Insert row above
      </MenuItem>
      <MenuItem onClick={() => { dispatch(deleteRow(row)); dispatch(hideContextMenu()); }}>
        Delete row
      </MenuItem>
      <div style={{ height: 1, background: '#e0e0e0', margin: '4px 0' }} />
      <MenuItem onClick={() => { dispatch(insertColumn(col + 1)); dispatch(hideContextMenu()); }}>
        Insert column right
      </MenuItem>
      <MenuItem onClick={() => { dispatch(insertColumn(col)); dispatch(hideContextMenu()); }}>
        Insert column left
      </MenuItem>
      <MenuItem onClick={() => { dispatch(deleteColumn(col)); dispatch(hideContextMenu()); }}>
        Delete column
      </MenuItem>
    </div>
  );
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '6px 16px',
        cursor: 'pointer',
        fontSize: 13,
        userSelect: 'none',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </div>
  );
}
