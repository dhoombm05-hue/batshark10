export interface DocumentFolder {
  id: string;
  name: string;
  parent_id: string | null;
  keywords: string[];
}

export function parseKeywords(value: string): string[] {
  return [...new Set(value.split(/[,،\n]+/).map(word => word.trim()).filter(Boolean))];
}

export function folderTrail(folders: DocumentFolder[], id: string | null): DocumentFolder[] {
  const trail: DocumentFolder[] = [];
  const visited = new Set<string>();
  let current = id;
  while (current && !visited.has(current)) {
    visited.add(current);
    const folder = folders.find(item => item.id === current);
    if (!folder) break;
    trail.unshift(folder);
    current = folder.parent_id;
  }
  return trail;
}

export function matchesDocumentSearch(item: { title?: string; name?: string; file_name?: string; description?: string | null; keywords?: string[] }, search: string): boolean {
  const text = [item.title, item.name, item.file_name, item.description, ...(item.keywords || [])].join(' ').normalize('NFKC').toLocaleLowerCase();
  return search.trim().normalize('NFKC').toLocaleLowerCase().split(/\s+/).every(word => text.includes(word));
}

export function folderContains(folders: DocumentFolder[], ancestor: string, candidate: string): boolean {
  return folderTrail(folders, candidate).some(folder => folder.id === ancestor);
}