import { useMemo, useState } from 'react';
import { Folder, FolderOpen, FolderPlus, FilePlus2, Upload, Search, ChevronLeft, Download, Eye, Pencil, Trash2, FileText, Loader2, Home, Plus, SlidersHorizontal, MoreHorizontal, X, RefreshCw, ChevronDown, Clock3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { folderTrail, folderContains, matchesDocumentSearch, type DocumentFolder } from '@/lib/document-utils';
import type { LibraryDocument } from '@/hooks/useDocumentLibrary';
import { DOCUMENT_CATEGORIES } from './DocumentComposer';

interface Props {
  folders: DocumentFolder[];
  docs: LibraryDocument[];
  folderId: string | null;
  isCEO: boolean;
  loading: boolean;
  error: unknown;
  navigate: (id: string | null) => void;
  addFolder: (folder?: DocumentFolder) => void;
  addDocument: (mode: 'import' | 'create') => void;
  preview: (doc: LibraryDocument) => void;
  download: (doc: LibraryDocument) => void;
  edit: (doc: LibraryDocument) => void;
  remove: (target: { id: string; name: string; kind: 'folder' | 'doc' }) => void;
  refresh: () => void;
}

function fileSize(size: number) { return size >= 1048576 ? `${(size / 1048576).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`; }

export default function DocumentBrowser(props: Props) {
  const { folders, docs, folderId, isCEO } = props;
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(false);
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [scope, setScope] = useState<'library' | 'recent'>('library');
  const [expanded, setExpanded] = useState<string[]>([]);
  const trail = folderTrail(folders, folderId);
  const navigate = (id: string | null) => { setSearch(''); setScope('library'); props.navigate(id); if (id) setExpanded(current => [...new Set([...current, ...folderTrail(folders, id).map(folder => folder.id)])]); };
  const extensions = useMemo(() => [...new Set(docs.map(doc => doc.file_name.split('.').pop()?.toLowerCase()).filter((value): value is string => Boolean(value)))].sort(), [docs]);
  const visibleFolders = folders.filter(folder => search.trim() ? matchesDocumentSearch(folder, search) : scope === 'library' && folder.parent_id === folderId);
  const visibleDocs = docs.filter(doc => (search.trim() ? matchesDocumentSearch(doc, search) : scope === 'recent' || (folderId ? doc.folder_id === folderId : !doc.folder_id)) && (category === 'all' || doc.category === category) && (type === 'all' || doc.file_name.toLowerCase().endsWith(`.${type}`)));
  // The library overview shows recent files beneath the grouped folders, not an empty root message.
  const overview = !folderId && scope === 'library' && !search.trim() && category === 'all' && type === 'all';
  const displayedDocs = overview ? docs.slice(0, 6) : visibleDocs;
  const folderMenu = (folder: DocumentFolder) => isCEO && <DropdownMenu dir="rtl"><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="shrink-0 size-8" aria-label={`خيارات مجلد ${folder.name}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => props.addFolder(folder)}><Pencil className="size-4" />تسمية ونقل</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => props.remove({ id: folder.id, name: folder.name, kind: 'folder' })}><Trash2 className="size-4" />حذف المجلد</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
  const renderTree = (parentId: string | null, visited = new Set<string>()): React.ReactNode => folders.filter(folder => folder.parent_id === parentId && !visited.has(folder.id)).map(folder => {
    const children = folders.some(item => item.parent_id === folder.id);
    const open = expanded.includes(folder.id);
    return <div key={folder.id}><div className={`flex items-center rounded-md ${folderId === folder.id ? 'bg-primary/10 text-primary' : 'text-foreground'}`}>
      <Button variant="ghost" className="h-10 flex-1 min-w-0 justify-start gap-2 px-2 hover:bg-secondary" onClick={() => navigate(folder.id)}><Folder className="size-4 text-primary" /><span className="truncate text-sm font-normal">{folder.name}</span></Button>
      {children && <Button size="icon" variant="ghost" className="size-8 shrink-0" aria-label={`${open ? 'طي' : 'توسيع'} ${folder.name}`} onClick={() => setExpanded(current => open ? current.filter(id => id !== folder.id) : [...current, folder.id])}>{open ? <ChevronDown /> : <ChevronLeft />}</Button>}
    </div>{open && <div className="mr-4 pr-2 border-r border-border">{renderTree(folder.id, new Set([...visited, folder.id]))}</div>}</div>;
  });
  return <div dir="rtl" className="min-w-0 space-y-6 bg-background min-h-[calc(100dvh-3rem)] p-3 sm:p-5">
    <header className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2 pr-9 lg:pr-0"><FolderOpen className="size-6 text-primary" /><h1 className="font-heading font-bold text-xl sm:text-2xl">مركز الملفات</h1></div><p className="text-sm text-muted-foreground mt-2">{docs.length} ملف <span className="mx-2">/</span> {folders.length} مجلد</p></div>
      <DropdownMenu dir="rtl"><DropdownMenuTrigger asChild><Button className="shrink-0"><Plus />إضافة<ChevronDown /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52"><DropdownMenuItem onSelect={() => props.addDocument('import')}><Upload className="size-4" />استيراد ملف</DropdownMenuItem><DropdownMenuItem onSelect={() => props.addDocument('create')}><FilePlus2 className="size-4" />إنشاء مستند</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => props.addFolder()}><FolderPlus className="size-4" />مجلد جديد</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    </header>
    <div className="grid lg:grid-cols-[210px_minmax(0,1fr)] gap-6 border-t border-border pt-5">
      <aside className="lg:border-l lg:border-border lg:pl-5 min-w-0"><div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
        <Button variant="ghost" className={`justify-start shrink-0 ${scope === 'library' && !folderId ? 'bg-primary/10 text-primary' : ''}`} onClick={() => navigate(null)}><Home />المكتبة</Button>
        <Button variant="ghost" className={`justify-start shrink-0 ${scope === 'recent' ? 'bg-primary/10 text-primary' : ''}`} onClick={() => { props.navigate(null); setSearch(''); setScope('recent'); }}><Clock3 />أحدث الملفات</Button>
      </div><div className="hidden lg:block mt-6"><div className="flex items-center justify-between mb-2"><h2 className="text-xs font-semibold text-muted-foreground">مجلداتي</h2><Button variant="ghost" size="icon" className="size-7" title="مجلد جديد" aria-label="إضافة مجلد" onClick={() => props.addFolder()}><Plus /></Button></div>{renderTree(null)}</div></aside>
      <div className="min-w-0 space-y-5">
        <div className="flex gap-2"><div className="relative flex-1 min-w-0"><Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /><Input aria-label="البحث في الملفات" className="pr-10 bg-card" placeholder="اسم الملف أو كلمة مفتاحية" value={search} onChange={event => setSearch(event.target.value)} />{search && <Button variant="ghost" size="icon" className="absolute left-1 top-1 size-8" aria-label="مسح البحث" onClick={() => setSearch('')}><X /></Button>}</div><Button variant={filters ? 'secondary' : 'outline'} size="icon" title="تصفية الملفات" aria-label="تصفية الملفات" onClick={() => setFilters(!filters)}><SlidersHorizontal /></Button></div>
        {filters && <div className="flex flex-wrap gap-2"><Select value={category} onValueChange={setCategory}><SelectTrigger className="w-40" aria-label="تصفية حسب التصنيف"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل التصنيفات</SelectItem>{DOCUMENT_CATEGORIES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={type} onValueChange={setType}><SelectTrigger className="w-32" aria-label="تصفية حسب النوع"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الأنواع</SelectItem>{extensions.map(ext => <SelectItem value={ext} key={ext}>{ext.toUpperCase()}</SelectItem>)}</SelectContent></Select>{(category !== 'all' || type !== 'all') && <Button variant="ghost" onClick={() => { setCategory('all'); setType('all'); }}><X />مسح التصفية</Button>}</div>}
        <nav aria-label="مسار المجلد" className="flex items-center flex-wrap gap-1"><Button variant="ghost" size="sm" className="px-0" onClick={() => navigate(null)}>المكتبة</Button>{trail.map(folder => <span key={folder.id} className="inline-flex items-center gap-1"><ChevronLeft className="size-3 text-muted-foreground" /><Button variant="ghost" size="sm" className="h-auto py-1 whitespace-normal text-right" onClick={() => navigate(folder.id)}>{folder.name}</Button></span>)}{scope === 'recent' && <><ChevronLeft className="size-3" /><span className="text-sm">أحدث الملفات</span></>}{search && <Badge variant="secondary">نتائج البحث</Badge>}</nav>
        {props.error ? <div className="py-14 text-center"><p>تعذر جلب الملفات</p><Button className="mt-3" variant="outline" onClick={props.refresh}><RefreshCw />إعادة المحاولة</Button></div> : props.loading ? <Loader2 className="size-7 animate-spin mx-auto my-14 text-primary" /> : <>
          {visibleFolders.length > 0 && <section><h2 className="text-sm font-heading font-bold mb-3">{folderId ? 'المجلدات الفرعية' : 'المجلدات'}</h2><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">{visibleFolders.map(folder => {
            const count = docs.filter(doc => doc.folder_id && folderContains(folders, folder.id, doc.folder_id)).length;
            return <div key={folder.id} className="rounded-lg border border-border bg-card p-4 flex items-center gap-2 hover:border-primary/50 transition-colors"><Button variant="ghost" className="p-0 h-auto flex-1 min-w-0 gap-3 justify-start text-right hover:bg-transparent" onClick={() => navigate(folder.id)}><span className="rounded-md p-2.5 bg-primary/10 text-primary"><Folder className="size-6" /></span><span className="min-w-0"><span className="block truncate font-semibold">{folder.name}</span><span className="block mt-1 text-xs text-muted-foreground font-normal">{count} ملف</span></span></Button>{folderMenu(folder)}</div>;
          })}</div></section>}
          <section><div className="flex items-center justify-between mb-3"><h2 className="text-sm font-heading font-bold">{overview ? 'آخر الملفات المضافة' : 'الملفات'} <span className="text-muted-foreground font-normal">{!overview && `(${displayedDocs.length})`}</span></h2>{overview && docs.length > 6 && <Button variant="link" size="sm" onClick={() => setScope('recent')}>عرض الكل<ChevronLeft /></Button>}{folderId && <Button variant="ghost" size="sm" onClick={() => navigate(trail.at(-1)?.parent_id || null)}><ArrowRight />رجوع</Button>}</div>
            {displayedDocs.length ? <div className="border-t border-border"><div className="hidden xl:grid grid-cols-[minmax(0,1fr)_100px_110px_80px] gap-4 text-xs text-muted-foreground py-3 px-3 border-b border-border"><span>اسم الملف</span><span>الحجم</span><span>تاريخ الإضافة</span><span /></div>{displayedDocs.map(doc => <article key={doc.id} className="group flex xl:grid xl:grid-cols-[minmax(0,1fr)_100px_110px_80px] items-center gap-3 xl:gap-4 border-b border-border py-3 px-1 sm:px-3 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0"><div className={`p-2.5 rounded-md shrink-0 ${doc.file_name.endsWith('.pdf') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}><FileText className="size-5" /></div><div className="min-w-0 flex-1"><Button variant="link" onClick={() => props.preview(doc)} className="text-foreground text-sm font-semibold p-0 h-auto justify-start whitespace-normal text-right break-words hover:no-underline max-w-full">{doc.title}</Button><div className="text-xs text-muted-foreground mt-1 truncate"><span>{doc.file_name.split('.').pop()?.toUpperCase()}</span><span className="mx-1.5">·</span>{folderTrail(folders, doc.folder_id).map(folder => folder.name).join(' / ') || 'المكتبة'}{doc.keywords.length > 0 && <><span className="mx-1.5">·</span>{doc.keywords.slice(0, 2).join('، ')}</>}</div></div></div>
              <span className="hidden xl:block text-xs text-muted-foreground" dir="ltr">{fileSize(doc.file_size || 0)}</span><span className="hidden xl:block text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString('ar-SA')}</span>
              <div className="flex items-center justify-end gap-0 shrink-0"><Button variant="ghost" size="icon" className="size-8 text-muted-foreground" title="تحميل" aria-label={`تحميل ${doc.title}`} onClick={() => props.download(doc)}><Download /></Button><DropdownMenu dir="rtl"><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label={`خيارات ${doc.title}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => props.preview(doc)}><Eye className="size-4" />معاينة</DropdownMenuItem>{isCEO && <><DropdownMenuItem onSelect={() => props.edit(doc)}><Pencil className="size-4" />تعديل ونقل</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onSelect={() => props.remove({ id: doc.id, name: doc.title, kind: 'doc' })}><Trash2 className="size-4" />حذف الملف</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu></div>
            </article>)}</div> : <div className="py-10 text-center border-t border-border"><FolderOpen className="size-9 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">{search || category !== 'all' || type !== 'all' ? 'لا توجد نتائج مطابقة' : 'هذا المجلد فارغ'}</p>{!search && category === 'all' && type === 'all' && <Button variant="outline" size="sm" className="mt-4" onClick={() => props.addDocument('import')}><Upload />إضافة أول ملف</Button>}</div>}
          </section>
        </>}
      </div>
    </div>
  </div>;
}