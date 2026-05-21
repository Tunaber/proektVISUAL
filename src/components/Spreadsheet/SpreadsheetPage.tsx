import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector, loadDocument, clearSpreadsheet } from '../../store';
import { Spreadsheet } from './Spreadsheet';

export function SpreadsheetPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.spreadsheet);

  useEffect(() => {
    if (documentId) dispatch(loadDocument(documentId)).unwrap().catch(() => navigate('/not-found', { replace: true }));
    return () => { dispatch(clearSpreadsheet()) };
  }, [documentId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading spreadsheet...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#d32f2f' }}>{error}</div>;
  return <Spreadsheet />;
}
