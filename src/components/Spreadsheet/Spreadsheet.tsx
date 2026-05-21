import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector, setActiveCell, setSelectedRange, startEditing, setEditValue, commitEdit, cancelEdit, resizeColumn, resizeRow, showContextMenu, copySelection, cutSelection, pasteClipboard, deleteSelection, undo, redo, selectAll, setSaveStatus, saveDocument } from '../../store';
import { Cell } from './Cell';
import { FormulaBar } from './FormulaBar';
import { Toolbar } from './Toolbar';
import { ContextMenu } from './ContextMenu';

function colLabel(index: number): string {
  let label = '', n = index;
  while (n >= 0) { label = String.fromCharCode(65 + (n % 26)) + label; n = Math.floor(n / 26) - 1 }
  return label;
}

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 28;
const HEADER_WIDTH = 50;
const HEADER_HEIGHT = 28;

export function Spreadsheet() {
  const dispatch = useAppDispatch();
  const { document, activeCell, selectedRange, isEditing, editValue } = useAppSelector((s) => s.spreadsheet);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // Auto-save
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!document) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      dispatch(setSaveStatus('saving'));
      try { await dispatch(saveDocument(document)).unwrap(); dispatch(setSaveStatus('saved')) }
      catch { dispatch(setSaveStatus('error')) }
    }, 500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) };
  }, [document]);

  // Keyboard handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (document) { dispatch(setSaveStatus('saving')); dispatch(saveDocument(document)).unwrap().then(() => dispatch(setSaveStatus('saved'))).catch(() => dispatch(setSaveStatus('error'))) } return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); dispatch(e.shiftKey ? redo() : undo()); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); dispatch(redo()); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); dispatch(copySelection()); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') { e.preventDefault(); dispatch(cutSelection()); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); dispatch(pasteClipboard()); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); dispatch(selectAll()); return }

      if (!activeCell || !document) return;
      const { row, col } = activeCell;
      const maxRow = document.rows - 1;
      const maxCol = document.cols - 1;

      if (isEditing) {
        if (e.key === 'Enter') { e.preventDefault(); dispatch(commitEdit()); return }
        if (e.key === 'Escape') { e.preventDefault(); dispatch(cancelEdit()); return }
        if (e.key === 'Tab') { e.preventDefault(); dispatch(commitEdit()); dispatch(setActiveCell({ row, col: Math.min(col + 1, maxCol) })); return }
        return;
      }

      if (e.key === 'Enter') { e.preventDefault(); const key = `${activeCell.row}_${activeCell.col}`; const cell = document.cells[key]; dispatch(setEditValue(cell?.value || '')); dispatch(startEditing()); return }
      if (e.key === 'Tab') { e.preventDefault(); dispatch(setActiveCell({ row, col: e.shiftKey ? Math.max(col - 1, 0) : Math.min(col + 1, maxCol) })); return }
      if (e.key === 'Escape') { dispatch(setActiveCell(null)); return }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); dispatch(deleteSelection()); return }

      const arrows: Record<string, { row: number; col: number }> = {
        ArrowUp: { row: Math.max(row - 1, 0), col }, ArrowDown: { row: Math.min(row + 1, maxRow), col },
        ArrowLeft: { row, col: Math.max(col - 1, 0) }, ArrowRight: { row, col: Math.min(col + 1, maxCol) },
      };
      if (arrows[e.key]) { e.preventDefault(); dispatch(setActiveCell(arrows[e.key])); return }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { e.preventDefault(); dispatch(setEditValue(e.key)); dispatch(startEditing()); return }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [document, activeCell, isEditing, editValue]);

  // Scroll handler
  useEffect(() => {
    if (!scrollRef.current) return;
    const el: HTMLDivElement = scrollRef.current;
    function onScroll() { setScrollLeft(el.scrollLeft); setScrollTop(el.scrollTop) }
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (!document) return <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>No document loaded</div>;

  const visibleCols = document?.cols ?? 26;
  const visibleRows = document?.rows ?? 100;
  const columns = Array.from({ length: visibleCols }, (_, i) => i);
  const rows = Array.from({ length: visibleRows }, (_, i) => i);
  const getColWidth = (col: number) => document?.columnWidths[col] ?? DEFAULT_COL_WIDTH;
  const getRowHeight = (row: number) => document?.rowHeights[row] ?? DEFAULT_ROW_HEIGHT;
  const totalWidth = columns.reduce((s, c) => s + getColWidth(c), 0) + HEADER_WIDTH;
  const totalHeight = rows.reduce((s, r) => s + getRowHeight(r), 0) + HEADER_HEIGHT;

  const isSelected = (row: number, col: number) => selectedRange ? (row >= selectedRange.start.row && row <= selectedRange.end.row && col >= selectedRange.start.col && col <= selectedRange.end.col) : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar />
      <FormulaBar />
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{ width: totalWidth, height: totalHeight, position: 'relative' }}>
          {/* Column headers */}
          <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex' }}>
            <div style={{ width: HEADER_WIDTH, height: HEADER_HEIGHT, borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc', background: '#f0f0f0', flexShrink: 0 }} />
            {(() => { let left = HEADER_WIDTH; return columns.map((col) => { const w = getColWidth(col); const l = left; left += w; return (
              <div key={col} style={{ width: w, height: HEADER_HEIGHT, borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, position: 'relative', flexShrink: 0, boxSizing: 'border-box' }}>
                {colLabel(col)}
                <div onMouseDown={(e) => {
                  const startX = e.clientX, startWidth = w;
                  function onMove(ev: MouseEvent) { dispatch(resizeColumn({ col, width: Math.max(20, startWidth + ev.clientX - startX) })) }
                  function onUp() { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                  window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, cursor: 'col-resize' }} />
              </div>
            )})})()}
          </div>
          {/* Row headers */}
          <div style={{ position: 'sticky', left: 0, zIndex: 2 }}>
            {(() => { let top = HEADER_HEIGHT; return rows.map((row) => { const h = getRowHeight(row); const t = top; top += h; return (
              <div key={row} style={{ position: 'absolute', top: t, left: 0, width: HEADER_WIDTH, height: h, borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, boxSizing: 'border-box' }}>
                {row + 1}
                <div onMouseDown={(e) => {
                  const startY = e.clientY, startHeight = h;
                  function onMove(ev: MouseEvent) { dispatch(resizeRow({ row, height: Math.max(20, startHeight + ev.clientY - startY) })) }
                  function onUp() { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                  window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                }} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, cursor: 'row-resize' }} />
              </div>
            )})})()}
          </div>
          {/* Cells */}
          <div style={{ position: 'absolute', top: HEADER_HEIGHT, left: HEADER_WIDTH }}>
            {rows.map((row) => (
              <div key={row} style={{ display: 'flex' }}>
                {columns.map((col) => {
                  const key = `${row}_${col}`;
                  return (
                    <Cell key={key} row={row} col={col} cellData={document.cells[key]}
                      isActive={activeCell?.row === row && activeCell?.col === col}
                      isSelected={isSelected(row, col)}
                      isEditing={isEditing && activeCell?.row === row && activeCell?.col === col}
                      editValue={editValue} width={getColWidth(col)} height={getRowHeight(row)}
                      onMouseDown={(r, c, e) => {
                        if (isEditing) { dispatch(commitEdit()); return }
                        if (e.shiftKey && activeCell) dispatch(setSelectedRange({ start: { row: Math.min(activeCell.row, r), col: Math.min(activeCell.col, c) }, end: { row: Math.max(activeCell.row, r), col: Math.max(activeCell.col, c) } }));
                        else dispatch(setActiveCell({ row: r, col: c }));
                      }}
                      onDoubleClick={(r, c) => { if (document) { const k = `${r}_${c}`; dispatch(setEditValue(document.cells[k]?.value || '')); dispatch(startEditing()) } }}
                      onContextMenu={(r, c, e) => { e.preventDefault(); dispatch(showContextMenu({ x: e.clientX, y: e.clientY, row: r, col: c })) }}
                      onEditChange={(val) => dispatch(setEditValue(val))} onEditCommit={() => dispatch(commitEdit())} onEditCancel={() => dispatch(cancelEdit())}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ContextMenu />
      <style>{`.col-resize-handle { cursor: col-resize; } .row-resize-handle { cursor: row-resize; }`}</style>
    </div>
  );
}
