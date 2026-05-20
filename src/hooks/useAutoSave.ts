import { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { saveDocument } from '../store/slices/spreadsheetSlice';
import { setSaveStatus } from '../store/slices/uiSlice';

export function useAutoSave() {
  const dispatch = useAppDispatch();
  const document = useAppSelector((s) => s.spreadsheet.document);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDocRef = useRef(document);

  useEffect(() => {
    if (!document) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      dispatch(setSaveStatus('saving'));
      try {
        await dispatch(saveDocument(document)).unwrap();
        dispatch(setSaveStatus('saved'));
      } catch {
        dispatch(setSaveStatus('error'));
      }
    }, 500);

    prevDocRef.current = document;

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [document, dispatch]);
}
