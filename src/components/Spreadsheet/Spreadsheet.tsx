import { useCallback, useRef, useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setActiveCell,
  setSelectedRange,
  startEditing,
  setEditValue,
  commitEdit,
  cancelEdit,
  resizeColumn,
  resizeRow,
} from '../../store/slices/spreadsheetSlice';
import { showContextMenu } from '../../store/slices/uiSlice';
import { Cell } from './Cell';
import { FormulaBar } from './FormulaBar';
import { Toolbar } from './Toolbar';
import { ContextMenu } from './ContextMenu';
import { colLabel } from '../../utils/spreadsheet';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useAutoSave } from '../../hooks/useAutoSave';
import type { CellPosition } from '../../types';

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 28;
const HEADER_WIDTH = 50;
const HEADER_HEIGHT = 28;

export function Spreadsheet() {
  const dispatch = useAppDispatch();
  const { document, activeCell, selectedRange, isEditing, editValue } = useAppSelector(
    (s) => s.spreadsheet,
  );

  useKeyboard();
  useAutoSave();

  const containerRef = useRef<HTMLDivElement>(null);
  const colResizing = useRef<{ col: number; startX: number; startWidth: number } | null>(null);
  const rowResizing = useRef<{ row: number; startY: number; startHeight: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleCols = useMemo(() => document?.cols ?? 26, [document]);
  const visibleRows = useMemo(() => document?.rows ?? 100, [document]);

  const columns = useMemo(
    () => Array.from({ length: visibleCols }, (_, i) => i),
    [visibleCols],
  );
  const rows = useMemo(
    () => Array.from({ length: visibleRows }, (_, i) => i),
    [visibleRows],
  );

  const getColWidth = useCallback(
    (col: number) => document?.columnWidths[col] ?? DEFAULT_COL_WIDTH,
    [document?.columnWidths],
  );

  const getRowHeight = useCallback(
    (row: number) => document?.rowHeights[row] ?? DEFAULT_ROW_HEIGHT,
    [document?.rowHeights],
  );

  const handleCellMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      if (isEditing) {
        dispatch(commitEdit());
        return;
      }

      if (e.shiftKey && activeCell) {
        dispatch(
          setSelectedRange({
            start: { row: Math.min(activeCell.row, row), col: Math.min(activeCell.col, col) },
            end: { row: Math.max(activeCell.row, row), col: Math.max(activeCell.col, col) },
          }),
        );
      } else {
        dispatch(setActiveCell({ row, col }));
      }
    },
    [dispatch, activeCell, isEditing],
  );

  const handleDoubleClick = useCallback(
    (row: number, col: number) => {
      if (document) {
        const key = `${row}_${col}`;
        const cell = document.cells[key];
        dispatch(setEditValue(cell?.value || ''));
        dispatch(startEditing());
      }
    },
    [dispatch, document],
  );

  const handleContextMenu = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      e.preventDefault();
      dispatch(showContextMenu({ x: e.clientX, y: e.clientY, row, col }));
    },
    [dispatch],
  );

  const handleEditChange = useCallback(
    (value: string) => dispatch(setEditValue(value)),
    [dispatch],
  );

  const handleEditCommit = useCallback(() => dispatch(commitEdit()), [dispatch]);
  const handleEditCancel = useCallback(() => dispatch(cancelEdit()), [dispatch]);

  const isSelected = useCallback(
    (row: number, col: number) => {
      if (!selectedRange) return false;
      return (
        row >= selectedRange.start.row &&
        row <= selectedRange.end.row &&
        col >= selectedRange.start.col &&
        col <= selectedRange.end.col
      );
    },
    [selectedRange],
  );

  const totalWidth = columns.reduce((s, c) => s + getColWidth(c), 0) + HEADER_WIDTH;
  const totalHeight = rows.reduce((s, r) => s + getRowHeight(r), 0) + HEADER_HEIGHT;

  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setScrollLeft(el.scrollLeft);
      setScrollTop(el.scrollTop);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  if (!document) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>No document loaded</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar />
      <FormulaBar />
      <div
        ref={scrollRef}
        style={{ flex: 1, overflow: 'auto', position: 'relative' }}
      >
        <div style={{ width: totalWidth, height: totalHeight, position: 'relative' }}>
          <ColumnHeaders
            columns={columns}
            widths={columns.map(getColWidth)}
            scrollLeft={scrollLeft}
            onResizeStart={(col, e) => {
              colResizing.current = { col, startX: e.clientX, startWidth: getColWidth(col) };
              const handleMouseMove = (e: MouseEvent) => {
                if (!colResizing.current) return;
                const diff = e.clientX - colResizing.current.startX;
                const newWidth = Math.max(20, colResizing.current.startWidth + diff);
                dispatch(resizeColumn({ col: colResizing.current.col, width: newWidth }));
              };
              const handleMouseUp = () => {
                colResizing.current = null;
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
              };
              window.addEventListener('mousemove', handleMouseMove);
              window.addEventListener('mouseup', handleMouseUp);
            }}
          />
          <RowHeaders
            rows={rows}
            heights={rows.map(getRowHeight)}
            scrollTop={scrollTop}
            onResizeStart={(row, e) => {
              rowResizing.current = { row, startY: e.clientY, startHeight: getRowHeight(row) };
              const handleMouseMove = (e: MouseEvent) => {
                if (!rowResizing.current) return;
                const diff = e.clientY - rowResizing.current.startY;
                const newHeight = Math.max(20, rowResizing.current.startHeight + diff);
                dispatch(resizeRow({ row: rowResizing.current.row, height: newHeight }));
              };
              const handleMouseUp = () => {
                rowResizing.current = null;
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
              };
              window.addEventListener('mousemove', handleMouseMove);
              window.addEventListener('mouseup', handleMouseUp);
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: HEADER_HEIGHT,
              left: HEADER_WIDTH,
            }}
          >
            {rows.map((row) => (
              <div key={row} style={{ display: 'flex' }}>
                {columns.map((col) => {
                  const key = `${row}_${col}`;
                  const cellData = document.cells[key];
                  return (
                    <Cell
                      key={`${row}_${col}`}
                      row={row}
                      col={col}
                      cellData={cellData}
                      isActive={activeCell?.row === row && activeCell?.col === col}
                      isSelected={isSelected(row, col)}
                      isEditing={isEditing && activeCell?.row === row && activeCell?.col === col}
                      editValue={editValue}
                      width={getColWidth(col)}
                      height={getRowHeight(row)}
                      onMouseDown={handleCellMouseDown}
                      onDoubleClick={handleDoubleClick}
                      onContextMenu={handleContextMenu}
                      onEditChange={handleEditChange}
                      onEditCommit={handleEditCommit}
                      onEditCancel={handleEditCancel}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ContextMenu />
      <style>{`
        .col-resize-handle { cursor: col-resize; }
        .row-resize-handle { cursor: row-resize; }
      `}</style>
    </div>
  );
}

import React from 'react';

function ColumnHeaders({
  columns,
  widths,
  scrollLeft,
  onResizeStart,
}: {
  columns: number[];
  widths: number[];
  scrollLeft: number;
  onResizeStart: (col: number, e: React.MouseEvent) => void;
}) {
  let left = HEADER_WIDTH;
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex' }}>
      <div
        style={{
          width: HEADER_WIDTH,
          height: HEADER_HEIGHT,
          borderRight: '1px solid #ccc',
          borderBottom: '1px solid #ccc',
          background: '#f0f0f0',
          flexShrink: 0,
        }}
      />
      {columns.map((col, i) => {
        const w = widths[i];
        const l = left;
        left += w;
        return (
          <div
            key={col}
            style={{
              width: w,
              height: HEADER_HEIGHT,
              borderRight: '1px solid #ccc',
              borderBottom: '1px solid #ccc',
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              position: 'relative',
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          >
            {colLabel(col)}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 4,
                cursor: 'col-resize',
              }}
              onMouseDown={(e) => onResizeStart(col, e)}
            />
          </div>
        );
      })}
    </div>
  );
}

function RowHeaders({
  rows,
  heights,
  scrollTop,
  onResizeStart,
}: {
  rows: number[];
  heights: number[];
  scrollTop: number;
  onResizeStart: (row: number, e: React.MouseEvent) => void;
}) {
  let top = HEADER_HEIGHT;
  return (
    <div style={{ position: 'sticky', left: 0, zIndex: 2 }}>
      {rows.map((row, i) => {
        const h = heights[i];
        const t = top;
        top += h;
        return (
          <div
            key={row}
            style={{
              position: 'absolute',
              top: t,
              left: 0,
              width: HEADER_WIDTH,
              height: h,
              borderRight: '1px solid #ccc',
              borderBottom: '1px solid #ccc',
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              boxSizing: 'border-box',
            }}
          >
            {row + 1}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 4,
                cursor: 'row-resize',
              }}
              onMouseDown={(e) => onResizeStart(row, e)}
            />
          </div>
        );
      })}
    </div>
  );
}
