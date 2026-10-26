import { describe, expect, it } from 'vitest';
import { folderTrail, matchesDocumentSearch, parseKeywords, folderContains } from './document-utils';

const folders = [{ id: 'a', name: 'الشركة', parent_id: null, keywords: [] }, { id: 'b', name: 'العقود', parent_id: 'a', keywords: [] }, { id: 'c', name: '2026', parent_id: 'b', keywords: [] }];
describe('document organization', () => {
  it('keeps named folders nested inside their parent', () => {
    expect(folderTrail(folders, 'c').map(item => item.name)).toEqual(['الشركة', 'العقود', '2026']);
  });
  it('finds a file by its keywords instead of requiring its title', () => {
    expect(matchesDocumentSearch({ title: 'اتفاقية', keywords: ['شراكة', 'بادل'] }, 'بادل شراكة')).toBe(true);
    expect(matchesDocumentSearch({ title: 'اتفاقية', keywords: ['شراكة'] }, 'بادل')).toBe(false);
  });
  it('normalizes Arabic keyword separators without losing words', () => {
    expect(parseKeywords('عقد، بادل, عقد')).toEqual(['عقد', 'بادل']);
  });
  it('identifies descendants to prevent moving a folder into itself', () => {
    expect(folderContains(folders, 'a', 'c')).toBe(true);
    expect(folderContains(folders, 'c', 'a')).toBe(false);
  });
});