import { naturalSortCompare } from './sorting.utils';

describe('naturalSortCompare', () => {
  it('should sort strings alphabetically when no numbers present', () => {
    expect(naturalSortCompare('apple', 'banana')).toBeLessThan(0);
    expect(naturalSortCompare('banana', 'apple')).toBeGreaterThan(0);
    expect(naturalSortCompare('apple', 'apple')).toBe(0);
  });

  it('should sort numeric strings numerically', () => {
    expect(naturalSortCompare('1', '2')).toBeLessThan(0);
    expect(naturalSortCompare('10', '2')).toBeGreaterThan(0);
    expect(naturalSortCompare('5', '5')).toBe(0);
  });

  it('should sort alphanumeric strings naturally', () => {
    expect(naturalSortCompare('item1', 'item2')).toBeLessThan(0);
    expect(naturalSortCompare('item10', 'item2')).toBeGreaterThan(0);
    expect(naturalSortCompare('item2', 'item10')).toBeLessThan(0);
  });

  it('should handle strings with multiple numeric parts', () => {
    expect(naturalSortCompare('a1b2', 'a1b10')).toBeLessThan(0);
    expect(naturalSortCompare('file1page2', 'file1page10')).toBeLessThan(0);
    expect(naturalSortCompare('v1.2.3', 'v1.2.10')).toBeLessThan(0);
  });

  it('should handle empty strings', () => {
    expect(naturalSortCompare('', 'a')).toBeLessThan(0);
    expect(naturalSortCompare('a', '')).toBeGreaterThan(0);
    expect(naturalSortCompare('', '')).toBe(0);
  });

  it('should handle strings starting with numbers', () => {
    expect(naturalSortCompare('1item', '2item')).toBeLessThan(0);
    expect(naturalSortCompare('10item', '2item')).toBeGreaterThan(0);
  });

  it('should handle strings with only numbers', () => {
    expect(naturalSortCompare('100', '99')).toBeGreaterThan(0);
    expect(naturalSortCompare('001', '1')).toBe(0); // parseInt ignores leading zeros
  });

  it('should handle mixed case strings', () => {
    expect(naturalSortCompare('Item1', 'item1')).toBe(0); // localeCompare is case-insensitive by default in some locales
    expect(naturalSortCompare('A', 'a')).toBe(0);
  });

  it('should work correctly with array sort method', () => {
    const items = ['item10', 'item1', 'item2', 'item20'];
    const sorted = items.sort(naturalSortCompare);
    expect(sorted).toEqual(['item1', 'item2', 'item10', 'item20']);
  });

  it('should handle real-world driver names with numbers', () => {
    const drivers = ['Driver 10', 'Driver 1', 'Driver 2', 'Driver'];
    const sorted = drivers.sort(naturalSortCompare);
    expect(sorted).toEqual(['Driver', 'Driver 1', 'Driver 2', 'Driver 10']);
  });

  it('should handle race names with numbers', () => {
    const races = ['Race 100', 'Race 5', 'Race 10', 'Race 1'];
    const sorted = races.sort(naturalSortCompare);
    expect(sorted).toEqual(['Race 1', 'Race 5', 'Race 10', 'Race 100']);
  });

  it('should handle team names with numbers', () => {
    const teams = ['Team A10', 'Team A1', 'Team A2', 'Team B1'];
    const sorted = teams.sort(naturalSortCompare);
    expect(sorted).toEqual(['Team A1', 'Team A2', 'Team A10', 'Team B1']);
  });
});
