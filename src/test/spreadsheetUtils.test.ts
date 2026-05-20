import { describe, it, expect } from 'vitest';
import { colLabel, parseCellRef, cellRefString, evaluateFormula, computeCellValue } from '../utils/spreadsheet';
import type { CellData } from '../types';

describe('spreadsheet utils', () => {
  describe('colLabel', () => {
    it('should return A for 0', () => expect(colLabel(0)).toBe('A'));
    it('should return Z for 25', () => expect(colLabel(25)).toBe('Z'));
    it('should return AA for 26', () => expect(colLabel(26)).toBe('AA'));
    it('should return AZ for 51', () => expect(colLabel(51)).toBe('AZ'));
  });

  describe('parseCellRef', () => {
    it('should parse A1', () => expect(parseCellRef('A1')).toEqual({ row: 0, col: 0 }));
    it('should parse Z10', () => expect(parseCellRef('Z10')).toEqual({ row: 9, col: 25 }));
    it('should parse AA1', () => expect(parseCellRef('AA1')).toEqual({ row: 0, col: 26 }));
    it('should return null for invalid', () => expect(parseCellRef('')).toBeNull());
  });

  describe('cellRefString', () => {
    it('should return A1 for (0,0)', () => expect(cellRefString(0, 0)).toBe('A1'));
    it('should return Z10 for (9,25)', () => expect(cellRefString(9, 25)).toBe('Z10'));
    it('should return AA1 for (0,26)', () => expect(cellRefString(0, 26)).toBe('AA1'));
  });

  describe('computeCellValue', () => {
    it('should detect number', () => {
      const result = computeCellValue('42', {});
      expect(result.type).toBe('number');
      expect(result.computedValue).toBe(42);
    });

    it('should detect boolean', () => {
      expect(computeCellValue('true', {}).type).toBe('boolean');
      expect(computeCellValue('false', {}).computedValue).toBe(false);
    });

    it('should detect string', () => {
      const result = computeCellValue('hello', {});
      expect(result.type).toBe('string');
      expect(result.computedValue).toBe('hello');
    });

    it('should detect formula', () => {
      const result = computeCellValue('=1+2', {});
      expect(result.type).toBe('formula');
    });
  });

  describe('evaluateFormula', () => {
    const cells: Record<string, CellData> = {
      '0_0': { value: '10', type: 'number', style: {}, computedValue: 10 },
      '0_1': { value: '20', type: 'number', style: {}, computedValue: 20 },
      '0_2': { value: '30', type: 'number', style: {}, computedValue: 30 },
      '1_0': { value: '5', type: 'number', style: {}, computedValue: 5 },
      '1_1': { value: '15', type: 'number', style: {}, computedValue: 15 },
    };

    it('should add two cells', () => {
      expect(evaluateFormula('=A1+B1', cells)).toBe(30);
    });

    it('should multiply cell by number', () => {
      expect(evaluateFormula('=A1*2', cells)).toBe(20);
    });

    it('should evaluate SUM', () => {
      expect(evaluateFormula('=SUM(A1:C1)', cells)).toBe(60);
    });

    it('should evaluate AVERAGE', () => {
      expect(evaluateFormula('=AVERAGE(A1:B1)', cells)).toBe(15);
    });

    it('should evaluate MIN', () => {
      expect(evaluateFormula('=MIN(A1:A2)', cells)).toBe(5);
    });

    it('should evaluate MAX', () => {
      expect(evaluateFormula('=MAX(B1:B2)', cells)).toBe(20);
    });

    it('should evaluate COUNT', () => {
      expect(evaluateFormula('=COUNT(A1:B2)', cells)).toBe(4);
    });

    it('should handle #ERROR for invalid formula', () => {
      expect(evaluateFormula('=INVALID(', cells)).toBe('#ERROR');
    });
  });
});
