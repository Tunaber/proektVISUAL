import type { DocumentData, DocumentMeta, CellData } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STORAGE_KEY = 'spreadsheet_docs';
const META_KEY = 'spreadsheet_meta';

function getMeta(): DocumentMeta[] {
  const raw = localStorage.getItem(META_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveMeta(meta: DocumentMeta[]) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function getDoc(id: string): DocumentData | null {
  const raw = localStorage.getItem(`${STORAGE_KEY}_${id}`);
  return raw ? JSON.parse(raw) : null;
}

function putDoc(doc: DocumentData) {
  localStorage.setItem(`${STORAGE_KEY}_${doc.id}`, JSON.stringify(doc));
}

function removeDoc(id: string) {
  localStorage.removeItem(`${STORAGE_KEY}_${id}`);
}

let docCounter = Date.now();

export const api = {
  async getDocuments(userId: string): Promise<DocumentMeta[]> {
    await delay(200);
    const all = getMeta().filter((d) => d.userId === userId);
    return all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getDocument(id: string): Promise<DocumentData | null> {
    await delay(150);
    return getDoc(id);
  },

  async createDocument(
    userId: string,
    name: string,
    rows: number,
    cols: number,
  ): Promise<DocumentData> {
    await delay(300);
    const now = new Date().toISOString();
    const doc: DocumentData = {
      id: `doc_${++docCounter}`,
      name,
      userId,
      rows,
      cols,
      cells: {},
      columnWidths: {},
      rowHeights: {},
      createdAt: now,
      updatedAt: now,
    };
    putDoc(doc);
    const meta: DocumentMeta = {
      id: doc.id,
      name: doc.name,
      userId: doc.userId,
      rows: doc.rows,
      cols: Math.min(doc.cols, 3),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      preview: [],
    };
    const all = getMeta();
    all.push(meta);
    saveMeta(all);
    return doc;
  },

  async updateDocument(id: string, data: Partial<DocumentData>): Promise<DocumentData> {
    await delay(100);
    const doc = getDoc(id);
    if (!doc) throw new Error('Document not found');
    const updated = { ...doc, ...data, updatedAt: new Date().toISOString() };
    putDoc(updated);
    const all = getMeta();
    const idx = all.findIndex((m) => m.id === id);
    if (idx >= 0) {
      all[idx] = {
        ...all[idx],
        name: updated.name,
        rows: updated.rows,
        updatedAt: updated.updatedAt,
      };
      saveMeta(all);
    }
    return updated;
  },

  async deleteDocument(id: string): Promise<void> {
    await delay(200);
    removeDoc(id);
    const all = getMeta().filter((m) => m.id !== id);
    saveMeta(all);
  },

  async duplicateDocument(id: string): Promise<DocumentData> {
    await delay(300);
    const doc = getDoc(id);
    if (!doc) throw new Error('Document not found');
    const now = new Date().toISOString();
    const newDoc: DocumentData = {
      ...doc,
      id: `doc_${++docCounter}`,
      name: `${doc.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    putDoc(newDoc);
    const meta: DocumentMeta = {
      id: newDoc.id,
      name: newDoc.name,
      userId: newDoc.userId,
      rows: newDoc.rows,
      cols: Math.min(newDoc.cols, 3),
      createdAt: now,
      updatedAt: now,
      preview: [],
    };
    const all = getMeta();
    all.push(meta);
    saveMeta(all);
    return newDoc;
  },

  async renameDocument(id: string, name: string): Promise<void> {
    await delay(150);
    const doc = getDoc(id);
    if (doc) {
      doc.name = name;
      doc.updatedAt = new Date().toISOString();
      putDoc(doc);
    }
    const all = getMeta();
    const idx = all.findIndex((m) => m.id === id);
    if (idx >= 0) {
      all[idx].name = name;
      all[idx].updatedAt = new Date().toISOString();
      saveMeta(all);
    }
  },

  exportCSV(doc: DocumentData): string {
    const lines: string[] = [];
    for (let r = 0; r < doc.rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < doc.cols; c++) {
        const key = `${r}_${c}`;
        const cell = doc.cells[key];
        if (cell) {
          let val = cell.computedValue !== undefined ? String(cell.computedValue) : cell.value;
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          row.push(val);
        } else {
          row.push('');
        }
      }
      lines.push(row.join(','));
    }
    return lines.join('\n');
  },

  importCSV(csv: string): { rows: number; cols: number; cells: Record<string, CellData> } {
    const lines = csv.split('\n').filter((l) => l.trim());
    const cells: Record<string, CellData> = {};
    let maxCols = 0;
    lines.forEach((line, r) => {
      const vals = parseCSVLine(line);
      maxCols = Math.max(maxCols, vals.length);
      vals.forEach((val, c) => {
        if (val) {
          const key = `${r}_${c}`;
          cells[key] = {
            value: val,
            type: 'string',
            style: {},
            computedValue: val,
          };
        }
      });
    });
    return { rows: lines.length, cols: maxCols, cells };
  },

  importJSON(json: string): { rows: number; cols: number; cells: Record<string, CellData> } {
    const data = JSON.parse(json);
    return {
      rows: data.rows || 10,
      cols: data.cols || 5,
      cells: data.cells || {},
    };
  },
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
