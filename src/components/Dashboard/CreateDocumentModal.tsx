import { useState, useCallback } from 'react';

interface Props {
  onClose: () => void;
  onCreate: (name: string, rows: number, cols: number) => void;
}

export function CreateDocumentModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('Untitled Document');
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(5);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
        onCreate(name.trim(), rows, cols);
      }
    },
    [name, rows, cols, onCreate],
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 24,
          width: 360,
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>New Document</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#555' }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#555' }}>Rows</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#555' }}>Columns</label>
              <input
                type="number"
                min={1}
                max={26}
                value={cols}
                onChange={(e) => setCols(Math.max(1, Math.min(26, parseInt(e.target.value) || 1)))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 20px',
                border: '1px solid #ccc',
                borderRadius: 4,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                background: '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
