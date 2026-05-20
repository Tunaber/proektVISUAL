import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDocuments, createDocument, deleteDocument, duplicateDocument, renameDocument } from '../../store/slices/documentsSlice';
import { CreateDocumentModal } from './CreateDocumentModal';

export function Dashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { documents, loading } = useAppSelector((s) => s.documents);
  const user = useAppSelector((s) => s.auth.user);
  const [showCreate, setShowCreate] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (user) {
      dispatch(fetchDocuments(user.id));
    }
  }, [dispatch, user]);

  const handleCreate = useCallback(
    async (name: string, rows: number, cols: number) => {
      if (!user) return;
      const result = await dispatch(createDocument({ userId: user.id, name, rows, cols })).unwrap();
      setShowCreate(false);
      navigate(`/documents/${result.id}`);
    },
    [dispatch, navigate, user],
  );

  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this document?')) {
        dispatch(deleteDocument(id));
      }
    },
    [dispatch],
  );

  const handleDuplicate = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(duplicateDocument(id));
    },
    [dispatch],
  );

  const handleRenameStart = useCallback(
    (id: string, currentName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setRenamingId(id);
      setRenameValue(currentName);
    },
    [],
  );

  const handleRenameSubmit = useCallback(
    (id: string) => {
      if (renameValue.trim()) {
        dispatch(renameDocument({ id, name: renameValue.trim() }));
      }
      setRenamingId(null);
    },
    [dispatch, renameValue],
  );

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading documents...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>My Documents</h1>
        <button
          onClick={() => setShowCreate(true)}
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
          + New Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>
          <p style={{ fontSize: 18 }}>No documents yet</p>
          <p>Create your first spreadsheet to get started</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => navigate(`/documents/${doc.id}`)}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: 16,
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                background: '#fff',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>
                {doc.cols} × {doc.rows}
              </div>
              {renamingId === doc.id ? (
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(doc.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(doc.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: 16,
                    border: '1px solid #1a73e8',
                    borderRadius: 4,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3
                  style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}
                  onDoubleClick={(e) => handleRenameStart(doc.id, doc.name, e)}
                >
                  {doc.name}
                </h3>
              )}
              <div style={{ fontSize: 12, color: '#888' }}>
                Created: {new Date(doc.createdAt).toLocaleDateString()}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                Modified: {new Date(doc.updatedAt).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <ActionButton onClick={(e) => handleRenameStart(doc.id, doc.name, e)} label="Rename" />
                <ActionButton onClick={(e) => handleDuplicate(doc.id, e)} label="Duplicate" />
                <ActionButton onClick={(e) => handleDelete(doc.id, e)} label="Delete" color="#d32f2f" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateDocumentModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  color = '#555',
}: {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        fontSize: 12,
        border: `1px solid ${color}`,
        borderRadius: 3,
        background: 'transparent',
        color,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
