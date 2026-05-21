import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector, fetchDocuments, createDocument, deleteDocument, duplicateDocument, renameDocument } from '../../store';
import { CreateDocumentModal } from './CreateDocumentModal';

export function Dashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { documents, loading } = useAppSelector((s) => s.documents);
  const user = useAppSelector((s) => s.auth.user);
  const [showCreate, setShowCreate] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => { if (user) dispatch(fetchDocuments(user.id)) }, [user]);

  async function handleCreate(name: string, rows: number, cols: number) {
    if (!user) return;
    const result = await dispatch(createDocument({ userId: user.id, name, rows, cols })).unwrap();
    setShowCreate(false);
    navigate(`/documents/${result.id}`);
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading documents...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>My Documents</h1>
        <button onClick={() => setShowCreate(true)}
          style={{ padding: '8px 20px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>+ New Document</button>
      </div>

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>
          <p style={{ fontSize: 18 }}>No documents yet</p>
          <p>Create your first spreadsheet to get started</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {documents.map((doc) => (
            <div key={doc.id} onClick={() => navigate(`/documents/${doc.id}`)}
              style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, cursor: 'pointer', background: '#fff' }}>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>{doc.cols} × {doc.rows}</div>
              {renamingId === doc.id ? (
                <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => { if (renameValue.trim()) dispatch(renameDocument({ id: doc.id, name: renameValue.trim() })); setRenamingId(null) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { if (renameValue.trim()) dispatch(renameDocument({ id: doc.id, name: renameValue.trim() })); setRenamingId(null) }
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  autoFocus style={{ width: '100%', padding: '4px 8px', fontSize: 16, border: '1px solid #1a73e8', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}
                  onClick={(e) => e.stopPropagation()} />
              ) : (
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}
                  onDoubleClick={(e) => { e.stopPropagation(); setRenamingId(doc.id); setRenameValue(doc.name) }}>{doc.name}</h3>
              )}
              <div style={{ fontSize: 12, color: '#888' }}>Created: {new Date(doc.createdAt).toLocaleDateString()}</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Modified: {new Date(doc.updatedAt).toLocaleDateString()}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={(e) => { e.stopPropagation(); setRenamingId(doc.id); setRenameValue(doc.name) }}
                  style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #555', borderRadius: 3, background: 'transparent', color: '#555', cursor: 'pointer' }}>Rename</button>
                <button onClick={(e) => { e.stopPropagation(); dispatch(duplicateDocument(doc.id)) }}
                  style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #555', borderRadius: 3, background: 'transparent', color: '#555', cursor: 'pointer' }}>Duplicate</button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this document?')) dispatch(deleteDocument(doc.id)) }}
                  style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #d32f2f', borderRadius: 3, background: 'transparent', color: '#d32f2f', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateDocumentModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}
