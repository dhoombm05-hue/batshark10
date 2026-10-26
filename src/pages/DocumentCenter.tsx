import { useMemo, useState } from 'react';
import { Folder, FolderOpen, FolderPlus, FilePlus2, Upload, Search, ChevronLeft, Download, Eye, Pencil, Trash2, FileText, Loader2, Home, ArrowRight, LayoutGrid, List, Tag, RefreshCw, MoreHorizontal } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentLibrary, type LibraryDocument } from '@/hooks/useDocumentLibrary';
import { folderTrail, folderContains, matchesDocumentSearch, parseKeywords, type DocumentFolder } from '@/lib/document-utils';
import DocumentComposer, { DOCUMENT_CATEGORIES } from '@/components/documents/DocumentComposer';
import '@/components/documents/document-center.css';
import { toast } from 'sonner';

function sizeLabel(size: number) { return size >= 1048576 ? `${(size / 1048576).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`; }

export default function DocumentCenter() {
  const { user, isCEO } = useAuthContext();
  const library = useDocumentLibrary();
  const { docs, folders, refresh } = library;
  const [folderId, setFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [fileType, setFileType] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [composer, setComposer] = useState<'import' | 'create' | null>(null);
  const [folderDialog, setFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);
  const [editingDoc, setEditingDoc] = useState<LibraryDocument | null>(null);
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState('root');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<LibraryDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; kind: 'folder' | 'doc' } | null>(null);
  const trail = folderTrail(folders, folderId);
  const extensions = useMemo(() => [...new Set(docs.map(doc => doc.file_name.split('.').pop()?.toLowerCase()).filter((value): value is string => Boolean(value)))].sort(), [docs]);
  const visibleFolders = folders.filter(folder => search.trim() ? matchesDocumentSearch(folder, search) : folder.parent_id === folderId);
  const visibleDocs = docs.filter(doc => (search.trim() ? matchesDocumentSearch(doc, search) : doc.folder_id === folderId) && (category === 'all' || doc.category === category) && (fileType === 'all' || doc.file_name.toLowerCase().endsWith(`.${fileType}`)));
  const navigate = (id: string | null) => { setFolderId(id); setSearch(''); };
  const openFolderDialog = (folder?: DocumentFolder) => {
    setEditingFolder(folder || null); setName(folder?.name || ''); setKeywords(folder?.keywords.join('، ') || ''); setParent(folder?.parent_id || folderId || 'root'); setFolderDialog(true);
  };
  const saveFolder = async () => {
    if (!name.trim() || !user) return;
    setBusy(true);
    try {
      const values = { name: name.trim(), keywords: parseKeywords(keywords), parent_id: parent === 'root' ? null : parent };
      const response = editingFolder ? await supabase.from('document_folders').update(values).eq('id', editingFolder.id).select('id').single() : await supabase.from('document_folders').insert({ ...values, created_by: user.id }).select('id').single();
      if (response.error) throw response.error;
      await refresh(); setFolderDialog(false); toast.success(editingFolder ? 'تم تحديث المجلد' : 'تم إنشاء المجلد');
    } catch { toast.error('تعذر حفظ المجلد؛ تحقق من الاتصال وأعد المحاولة'); } finally { setBusy(false); }
  };
  const openEdit = (doc: LibraryDocument) => { setEditingDoc(doc); setName(doc.title); setKeywords(doc.keywords.join('، ')); setDescription(doc.description || ''); setParent(doc.folder_id || 'root'); };
  const saveEdit = async () => {
    if (!editingDoc || !name.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('documents').update({ title: name.trim(), keywords: parseKeywords(keywords), description, folder_id: parent === 'root' ? null : parent }).eq('id', editingDoc.id).select('id').single();
      if (error) throw error;
      await refresh(); setEditingDoc(null); toast.success('تم تحديث الملف');
    } catch { toast.error('تعذر تحديث الملف؛ أعد المحاولة'); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const { error } = await supabase.from(deleteTarget.kind === 'folder' ? 'document_folders' : 'documents').delete().eq('id', deleteTarget.id).select('id').single();
      if (error) throw error;
      await refresh(); setDeleteTarget(null); toast.success('تم الحذف');
    } catch { toast.error(deleteTarget.kind === 'folder' ? 'انقل الملفات والمجلدات الفرعية أولاً قبل حذف هذا المجلد' : 'تعذر حذف الملف'); } finally { setBusy(false); }
  };
  const download = async (doc: LibraryDocument) => {
    try {
      const path = doc.file_url.split('/documents/')[1];
      if (!path) throw new Error();
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(decodeURIComponent(path), 60, { download: doc.file_name });
      if (error) throw error;
      const link = document.createElement('a'); link.href = data.signedUrl; link.download = doc.file_name; document.body.appendChild(link); link.click(); link.remove();
    } catch { toast.error('تعذر تحميل الملف؛ أعد المحاولة'); }
  };
  const closePreview = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreview(null); setPreviewUrl(''); setPreviewText(''); };
  const openPreview = async (doc: LibraryDocument) => {
    setPreview(doc); setPreviewLoading(true); setPreviewUrl(''); setPreviewText('');
    try {
      if (doc.content) { setPreviewText(doc.content); return; }
      const response = await fetch(doc.file_url);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      if (/\.(txt|md|csv)$/i.test(doc.file_name)) setPreviewText(await blob.text());
      else if (doc.file_type?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(doc.file_name)) setPreviewUrl(URL.createObjectURL(blob));
    } catch { toast.error('تعذر فتح المعاينة؛ يمكنك إعادة المحاولة أو تحميل الملف'); } finally { setPreviewLoading(false); }
  };
  const destinations = (excluded?: string) => <><SelectItem value="root">المكتبة الرئيسية</SelectItem>{folders.filter(folder => !excluded || !folderContains(folders, excluded, folder.id)).map(folder => <SelectItem key={folder.id} value={folder.id}>{folderTrail(folders, folder.id).map(item => item.name).join(' / ')}</SelectItem>)}</>;

  return <Layout><div dir="rtl" className="space-y-6 min-w-0">
    <header className="flex flex-wrap gap-4 justify-between items-center border-b border-border pb-6">
      <div className="flex items-center gap-3"><div className="bg-primary/10 text-primary p-3 rounded-lg"><FolderOpen className="size-7" /></div><div><h1 className="text-2xl font-heading font-bold">مركز الملفات</h1><p className="text-sm text-muted-foreground mt-1">{folders.length} مجلد · {docs.length} ملف · {sizeLabel(docs.reduce((sum, doc) => sum + (doc.file_size || 0), 0))}</p></div></div>
      <div className="flex gap-2 flex-wrap"><Button variant="outline" onClick={() => openFolderDialog()}><FolderPlus />مجلد جديد</Button><Button variant="outline" onClick={() => setComposer('import')}><Upload />استيراد ملف</Button><Button onClick={() => setComposer('create')}><FilePlus2 />إنشاء مستند</Button></div>
    </header>
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[180px]"><Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /><Input aria-label="البحث في الملفات" className="pr-10 bg-card" placeholder="ابحث بالاسم أو الكلمات المفتاحية..." value={search} onChange={event => setSearch(event.target.value)} /></div>
      <Select value={category} onValueChange={setCategory}><SelectTrigger className="w-36" aria-label="تصفية حسب التصنيف"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل التصنيفات</SelectItem>{DOCUMENT_CATEGORIES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
      <Select value={fileType} onValueChange={setFileType}><SelectTrigger className="w-32" aria-label="تصفية حسب النوع"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الأنواع</SelectItem>{extensions.map(ext => <SelectItem key={ext} value={ext}>{ext.toUpperCase()}</SelectItem>)}</SelectContent></Select>
      <div className="flex border border-border rounded-md"><Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" aria-label="عرض شبكي" onClick={() => setView('grid')}><LayoutGrid /></Button><Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" aria-label="عرض قائمة" onClick={() => setView('list')}><List /></Button></div>
    </div>
    <nav aria-label="مسار المجلد" className="flex flex-wrap items-center gap-1 text-sm"><Button variant="ghost" size="sm" onClick={() => navigate(null)}><Home />المكتبة</Button>{trail.map(folder => <span key={folder.id} className="flex items-center gap-1 min-w-0"><ChevronLeft className="size-4 text-muted-foreground shrink-0" /><Button variant="ghost" size="sm" className="whitespace-normal h-auto py-2 text-right break-words" onClick={() => navigate(folder.id)}>{folder.name}</Button></span>)}{search.trim() && <Badge variant="secondary">نتائج البحث في المكتبة</Badge>}</nav>
    {library.error ? <div className="py-16 text-center space-y-3"><p>تعذر جلب الملفات؛ ملفاتك المحفوظة لم تتغير.</p><Button variant="outline" onClick={() => refresh()}><RefreshCw />إعادة المحاولة</Button></div> : library.isLoading ? <div className="py-20 flex justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div> : <>
      {visibleFolders.length > 0 && <section className="space-y-3"><div className="flex items-center gap-2"><Folder className="size-4 text-primary" /><h2 className="font-heading font-bold text-sm">المجلدات</h2><span className="text-xs text-muted-foreground">{visibleFolders.length}</span></div><div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{visibleFolders.map(folder => {
        const count = docs.filter(doc => doc.folder_id && folderContains(folders, folder.id, doc.folder_id)).length;
        const children = folders.filter(item => item.parent_id === folder.id).length;
        return <div key={folder.id} className="border border-border bg-card rounded-lg flex items-center p-4 gap-3 hover:border-primary/50 transition-colors">
          <Button variant="ghost" className="flex-1 min-w-0 h-auto justify-start p-0 hover:bg-transparent gap-3 text-right" onClick={() => navigate(folder.id)}><Folder className="size-8 text-primary shrink-0" /><span className="min-w-0 flex-1"><span className="block font-bold truncate">{folder.name}</span><span className="block text-xs text-muted-foreground mt-1 font-normal">{count} ملف · {children} مجلد فرعي</span>{folder.keywords.length > 0 && <span className="block text-xs text-primary truncate mt-2">{folder.keywords.join(' · ')}</span>}</span></Button>
          {isCEO && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`خيارات مجلد ${folder.name}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => openFolderDialog(folder)}><Pencil className="size-4 ml-2" />تسمية ونقل المجلد</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => setDeleteTarget({ id: folder.id, name: folder.name, kind: 'folder' })}><Trash2 className="size-4 ml-2" />حذف المجلد</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
        </div>;
      })}</div></section>}
      <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-heading font-bold text-sm">الملفات <span className="text-muted-foreground font-normal">({visibleDocs.length})</span></h2>{folderId && <Button variant="ghost" size="sm" onClick={() => navigate(trail.at(-1)?.parent_id || null)}><ArrowRight />المجلد السابق</Button>}</div>
        {visibleDocs.length === 0 ? <div className="py-14 text-center border-t border-border"><FileText className="size-10 text-muted-foreground mx-auto mb-3" /><p className="font-semibold">{search || category !== 'all' || fileType !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا توجد ملفات في هذا المجلد'}</p></div> : <div className={view === 'grid' ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-3' : 'space-y-2'}>{visibleDocs.map(doc => <article key={doc.id} className={`border border-border bg-card rounded-lg p-4 min-w-0 ${view === 'list' ? 'sm:flex sm:items-center sm:gap-4' : ''}`}>
          <div className={`flex items-start gap-3 min-w-0 ${view === 'list' ? 'flex-1' : ''}`}><div className="bg-secondary p-3 rounded-md text-primary shrink-0"><FileText className="size-6" /></div><div className="min-w-0 flex-1"><Button variant="link" className="h-auto p-0 font-bold text-foreground whitespace-normal text-right justify-start break-words max-w-full" onClick={() => openPreview(doc)}>{doc.title}</Button><p className="text-xs text-muted-foreground truncate mt-1">{doc.file_name}</p><div className="flex gap-2 mt-2 text-xs items-center"><Badge variant="secondary">{doc.file_name.split('.').pop()?.toUpperCase()}</Badge><span className="text-muted-foreground">{sizeLabel(doc.file_size || 0)}</span></div></div></div>
          <div className={view === 'list' ? 'sm:w-64 mt-3 sm:mt-0 min-w-0' : 'mt-4 min-w-0'}>{doc.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2 break-words">{doc.description}</p>}<div className="flex gap-1 flex-wrap">{doc.keywords.map(word => <Badge key={word} variant="outline" className="font-normal gap-1 max-w-full break-all"><Tag className="size-3 shrink-0" />{word}</Badge>)}</div>{search.trim() && doc.folder_id && <p className="text-xs text-primary mt-2 truncate">{folderTrail(folders, doc.folder_id).map(item => item.name).join(' / ')}</p>}</div>
          <div className={`flex items-center gap-1 ${view === 'list' ? 'sm:shrink-0 mt-3 sm:mt-0' : 'mt-4 border-t border-border pt-3'}`}><span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{doc.uploaded_by}<span className="block mt-1">{new Date(doc.created_at).toLocaleDateString('ar-SA')}</span></span><Button size="icon" variant="ghost" title="معاينة" aria-label={`معاينة ${doc.title}`} onClick={() => openPreview(doc)}><Eye /></Button><Button size="icon" variant="ghost" title="تحميل" aria-label={`تحميل ${doc.title}`} onClick={() => download(doc)}><Download /></Button>{isCEO && <DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`خيارات ${doc.title}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => openEdit(doc)}><Pencil className="size-4 ml-2" />تعديل ونقل الملف</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => setDeleteTarget({ id: doc.id, name: doc.title, kind: 'doc' })}><Trash2 className="size-4 ml-2" />حذف</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</div>
        </article>)}</div>}
      </section>
    </>}
    {composer && <DocumentComposer mode={composer} folders={folders} folderId={folderId} onClose={() => setComposer(null)} onSaved={refresh} saveFile={library.saveFile} />}
    <Dialog open={folderDialog} onOpenChange={open => { if (!busy) setFolderDialog(open); }}><DialogContent dir="rtl"><DialogHeader><DialogTitle>{editingFolder ? 'تعديل المجلد' : 'مجلد جديد'}</DialogTitle><DialogDescription>{trail.map(folder => folder.name).join(' / ') || 'المكتبة الرئيسية'}</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="folder-name">اسم المجلد</Label><Input id="folder-name" autoFocus value={name} disabled={busy} onChange={event => setName(event.target.value)} /></div><div className="space-y-2"><Label>داخل المجلد</Label><Select value={parent} onValueChange={setParent} disabled={busy}><SelectTrigger aria-label="المجلد الأب"><SelectValue /></SelectTrigger><SelectContent>{destinations(editingFolder?.id)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="folder-keywords">كلمات مفتاحية</Label><Input id="folder-keywords" value={keywords} disabled={busy} onChange={event => setKeywords(event.target.value)} placeholder="عقود، مالية، مشروع" /></div></div><Button onClick={saveFolder} disabled={busy || !name.trim()}>{busy ? <Loader2 className="animate-spin" /> : <FolderPlus />}حفظ المجلد</Button></DialogContent></Dialog>
    <Dialog open={Boolean(editingDoc)} onOpenChange={open => { if (!open && !busy) setEditingDoc(null); }}><DialogContent dir="rtl"><DialogHeader><DialogTitle>تنظيم الملف</DialogTitle><DialogDescription>{editingDoc?.file_name}</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="edit-name">اسم الملف</Label><Input id="edit-name" value={name} onChange={event => setName(event.target.value)} disabled={busy} /></div><div className="space-y-2"><Label htmlFor="edit-description">الوصف</Label><Textarea id="edit-description" value={description} onChange={event => setDescription(event.target.value)} disabled={busy} /></div><div className="space-y-2"><Label htmlFor="edit-keywords">كلمات مفتاحية</Label><Input id="edit-keywords" value={keywords} onChange={event => setKeywords(event.target.value)} disabled={busy} /></div><Select value={parent} onValueChange={setParent} disabled={busy}><SelectTrigger aria-label="نقل إلى مجلد"><SelectValue /></SelectTrigger><SelectContent>{destinations()}</SelectContent></Select></div><Button onClick={saveEdit} disabled={busy || !name.trim()}>حفظ التغييرات</Button></DialogContent></Dialog>
    <Dialog open={Boolean(preview)} onOpenChange={open => { if (!open) closePreview(); }}><DialogContent dir="rtl" className="max-w-3xl max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle className="break-words">{preview?.title}</DialogTitle><DialogDescription>{preview?.file_name}</DialogDescription></DialogHeader>{previewLoading ? <Loader2 className="mx-auto animate-spin" /> : previewText ? <article className="document-paper p-6 rounded-md border border-border whitespace-pre-wrap break-words leading-8">{previewText}</article> : previewUrl ? <img src={previewUrl} alt={preview?.title} className="max-h-[60dvh] object-contain w-full" /> : <div className="py-8 text-center"><FileText className="size-10 mx-auto text-primary mb-3" /><p className="text-muted-foreground">معاينة هذا النوع متاحة بعد فتح الملف</p>{preview && <Button asChild variant="link"><a href={preview.file_url} target="_blank" rel="noopener noreferrer">فتح الملف</a></Button>}</div>}<Button onClick={() => { if (preview) download(preview); }}><Download />تحميل الملف</Button></DialogContent></Dialog>
    <Dialog open={Boolean(deleteTarget)} onOpenChange={open => { if (!open && !busy) setDeleteTarget(null); }}><DialogContent dir="rtl"><DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle><DialogDescription>هل تريد حذف «{deleteTarget?.name}»؟</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDeleteTarget(null)}>إلغاء</Button><Button variant="destructive" disabled={busy} onClick={remove}><Trash2 />حذف</Button></div></DialogContent></Dialog>
  </div></Layout>;
}
