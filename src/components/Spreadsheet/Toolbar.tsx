import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { applyStyleToRange } from '../../store/slices/spreadsheetSlice';
import type { CellStyle, CellRange } from '../../types';
import { setSaveStatus } from '../../store/slices/uiSlice';
import { saveDocument } from '../../store/slices/spreadsheetSlice';

export function Toolbar() {
  const dispatch = useAppDispatch();
  const { document, selectedRange, activeCell } = useAppSelector((s) => s.spreadsheet);
  const saveStatus = useAppSelector((s) => s.ui.saveStatus);

  const getRange = useCallback((): CellRange | null => {
    if (selectedRange) return selectedRange;
    if (activeCell) return { start: activeCell, end: activeCell };
    return null;
  }, [selectedRange, activeCell]);

  const applyStyle = useCallback(
    (style: Partial<CellStyle>) => {
      const range = getRange();
      if (range) {
        dispatch(applyStyleToRange({ range, style }));
      }
    },
    [dispatch, getRange],
  );

  const handleSave = useCallback(() => {
    if (document) {
      dispatch(setSaveStatus('saving'));
      dispatch(saveDocument(document))
        .unwrap()
        .then(() => dispatch(setSaveStatus('saved')))
        .catch(() => dispatch(setSaveStatus('error')));
    }
  }, [dispatch, document]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderBottom: '1px solid #ccc', background: '#f5f5f5', flexWrap: 'wrap' }}>
      <ToolbarButton onClick={() => applyStyle({ bold: true })} title="Bold (Ctrl+B)">
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton onClick={() => applyStyle({ italic: true })} title="Italic (Ctrl+I)">
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton onClick={() => applyStyle({ underline: true })} title="Underline (Ctrl+U)">
        <span style={{ textDecoration: 'underline' }}>U</span>
      </ToolbarButton>

      <div style={{ width: 1, height: 20, background: '#ccc', margin: '0 4px' }} />

      <ToolbarButton onClick={() => applyStyle({ textAlign: 'left' })} title="Align left">
        ≡
      </ToolbarButton>
      <ToolbarButton onClick={() => applyStyle({ textAlign: 'center' })} title="Align center">
        ≡
      </ToolbarButton>
      <ToolbarButton onClick={() => applyStyle({ textAlign: 'right' })} title="Align right">
        ≡
      </ToolbarButton>

      <div style={{ width: 1, height: 20, background: '#ccc', margin: '0 4px' }} />

      <select
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'number' || val === 'percent' || val === 'currency' || val === 'date') {
            applyStyle({ numberFormat: val });
          } else {
            applyStyle({ numberFormat: undefined });
          }
          e.target.value = '';
        }}
        style={{ fontSize: 12, padding: '2px 4px', border: '1px solid #ccc' }}
        defaultValue=""
      >
        <option value="" disabled>Format</option>
        <option value="number">Number</option>
        <option value="percent">Percent</option>
        <option value="currency">Currency</option>
        <option value="date">Date</option>
      </select>

      <input
        type="color"
        onChange={(e) => applyStyle({ color: e.target.value })}
        title="Text color"
        style={{ width: 22, height: 22, padding: 0, border: 'none', cursor: 'pointer' }}
      />
      <input
        type="color"
        onChange={(e) => applyStyle({ backgroundColor: e.target.value })}
        title="Background color"
        style={{ width: 22, height: 22, padding: 0, border: 'none', cursor: 'pointer' }}
      />

      <div style={{ flex: 1 }} />

      <span style={{ fontSize: 11, color: '#666' }}>
        {saveStatus === 'saved' && 'Saved'}
        {saveStatus === 'saving' && 'Saving...'}
        {saveStatus === 'error' && 'Error saving'}
      </span>
    </div>
  );
}

function ToolbarButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        border: '1px solid transparent',
        borderRadius: 3,
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#e0e0e0')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}
