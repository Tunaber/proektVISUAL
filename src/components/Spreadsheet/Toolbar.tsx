import { useAppDispatch, useAppSelector, applyStyleToRange, setSaveStatus, saveDocument } from '../../store';

interface CellStyle { bold?: boolean; italic?: boolean; underline?: boolean; fontSize?: number; fontFamily?: string; color?: string; backgroundColor?: string; textAlign?: 'left' | 'center' | 'right'; numberFormat?: 'number' | 'percent' | 'currency' | 'date' }
interface CellPos { row: number; col: number }

export function Toolbar() {
  const dispatch = useAppDispatch();
  const { document, selectedRange, activeCell } = useAppSelector((s) => s.spreadsheet);
  const saveStatus = useAppSelector((s) => s.ui.saveStatus);

  function getRange(): { start: CellPos; end: CellPos } | null {
    if (selectedRange) return selectedRange;
    if (activeCell) return { start: activeCell, end: activeCell };
    return null;
  }

  function applyStyle(style: Partial<CellStyle>) {
    const range = getRange();
    if (range) dispatch(applyStyleToRange({ range, style }));
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderBottom: '1px solid #ccc', background: '#f5f5f5', flexWrap: 'wrap' }}>
      <button onClick={() => applyStyle({ bold: true })} title="Bold" style={tb}><strong>B</strong></button>
      <button onClick={() => applyStyle({ italic: true })} title="Italic" style={tb}><em>I</em></button>
      <button onClick={() => applyStyle({ underline: true })} title="Underline" style={tb}><span style={{ textDecoration: 'underline' }}>U</span></button>
      <div style={{ width: 1, height: 20, background: '#ccc', margin: '0 4px' }} />
      <button onClick={() => applyStyle({ textAlign: 'left' })} title="Align left" style={tb}>≡</button>
      <button onClick={() => applyStyle({ textAlign: 'center' })} title="Align center" style={tb}>≡</button>
      <button onClick={() => applyStyle({ textAlign: 'right' })} title="Align right" style={tb}>≡</button>
      <div style={{ width: 1, height: 20, background: '#ccc', margin: '0 4px' }} />
      <select onChange={(e) => {
        const val = e.target.value;
        if (val === 'number' || val === 'percent' || val === 'currency' || val === 'date') applyStyle({ numberFormat: val });
        else applyStyle({ numberFormat: undefined });
        e.target.value = '';
      }} style={{ fontSize: 12, padding: '2px 4px', border: '1px solid #ccc' }} defaultValue="">
        <option value="" disabled>Format</option>
        <option value="number">Number</option>
        <option value="percent">Percent</option>
        <option value="currency">Currency</option>
        <option value="date">Date</option>
      </select>
      <input type="color" onChange={(e) => applyStyle({ color: e.target.value })} title="Text color" style={{ width: 22, height: 22, padding: 0, border: 'none', cursor: 'pointer' }} />
      <input type="color" onChange={(e) => applyStyle({ backgroundColor: e.target.value })} title="Background color" style={{ width: 22, height: 22, padding: 0, border: 'none', cursor: 'pointer' }} />
      <div style={{ flex: 1 }} />
      <button onClick={() => { if (document) { dispatch(setSaveStatus('saving')); dispatch(saveDocument(document)).unwrap().then(() => dispatch(setSaveStatus('saved'))).catch(() => dispatch(setSaveStatus('error'))) } }}
        style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #ccc', borderRadius: 3, background: '#fff', cursor: 'pointer' }}>Save</button>
      <span style={{ fontSize: 11, color: '#666' }}>
        {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Error saving'}
      </span>
    </div>
  );
}

const tb: React.CSSProperties = { width: 28, height: 28, border: '1px solid transparent', borderRadius: 3, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 };
