import { memo, useCallback, useRef, useEffect } from 'react';
import type { CellData } from '../../types';

interface CellProps {
  row: number;
  col: number;
  cellData: CellData | undefined;
  isActive: boolean;
  isSelected: boolean;
  isEditing: boolean;
  editValue: string | null;
  width: number;
  height: number;
  onMouseDown: (row: number, col: number, e: React.MouseEvent) => void;
  onDoubleClick: (row: number, col: number) => void;
  onContextMenu: (row: number, col: number, e: React.MouseEvent) => void;
  onEditChange: (value: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
}

export const Cell = memo(function Cell({
  row,
  col,
  cellData,
  isActive,
  isSelected,
  isEditing,
  editValue,
  width,
  height,
  onMouseDown,
  onDoubleClick,
  onContextMenu,
  onEditChange,
  onEditCommit,
  onEditCancel,
}: CellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => onMouseDown(row, col, e),
    [row, col, onMouseDown],
  );

  const handleDoubleClick = useCallback(
    () => onDoubleClick(row, col),
    [row, col, onDoubleClick],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => onContextMenu(row, col, e),
    [row, col, onContextMenu],
  );

  const displayValue = (() => {
    if (isEditing) return editValue || '';
    if (!cellData) return '';
    if (cellData.computedValue !== undefined && cellData.computedValue !== '') {
      return formatCellValue(cellData);
    }
    return cellData.value;
  })();

  const style: React.CSSProperties = {
    width,
    height,
    borderRight: '1px solid #d4d4d4',
    borderBottom: '1px solid #d4d4d4',
    padding: '0 4px',
    fontSize: 13,
    fontFamily: "'Segoe UI', Arial, sans-serif",
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    cursor: 'cell',
    boxSizing: 'border-box',
    background: cellData?.style?.backgroundColor || (isActive ? '#e8f0fe' : isSelected ? '#e8f0fe' : '#fff'),
    color: cellData?.style?.color || '#000',
    fontWeight: cellData?.style?.bold ? 700 : 400,
    fontStyle: cellData?.style?.italic ? 'italic' : 'normal',
    textDecoration: cellData?.style?.underline ? 'underline' : 'none',
    textAlign: cellData?.style?.textAlign || 'left',
    position: 'relative',
  };

  if (isEditing) {
    return (
      <div style={style}>
        <input
          ref={inputRef}
          value={editValue ?? ''}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); onEditCommit(); }
            if (e.key === 'Escape') { e.preventDefault(); onEditCancel(); }
          }}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            padding: 0,
            fontSize: 13,
            fontFamily: 'inherit',
            background: 'transparent',
            color: style.color,
            fontWeight: style.fontWeight,
            fontStyle: style.fontStyle,
            textDecoration: style.textDecoration,
            textAlign: style.textAlign,
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={style}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {displayValue}
    </div>
  );
});

function formatCellValue(cell: CellData): string {
  const val = cell.computedValue;
  if (val === undefined || val === null) return '';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') {
    switch (cell.style?.numberFormat) {
      case 'percent':
        return (val * 100).toFixed(2) + '%';
      case 'currency':
        return '$' + val.toFixed(2);
      case 'date':
        return new Date(val).toLocaleDateString();
      default:
        return String(val);
    }
  }
  return String(val);
}
