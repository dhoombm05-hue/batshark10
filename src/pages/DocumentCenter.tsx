import { useState } from 'react';
import { FolderPlus, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentLibrary, type LibraryDocument } from '@/hooks/useDocumentLibrary';
import { folderTrail, folderContains, parseKeywords, type DocumentFolder } from '@/lib/document-utils';
import DocumentComposer from '@/components/documents/DocumentComposer';
import DocumentBrowser from '@/components/documents/DocumentBrowser';
import '@/components/documents/document-center.css';
import { toast } from 'sonner';

export default function DocumentCenter() {
  const { user, isCEO } = useAuthContext();
  const library = useDocumentLibrary();
  const { docs, folders, refresh } = library;
  const [folderId, setFolderId] = useState<string | null>(null);
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

  return <Layout><div className="min-w-0">
    <DocumentBrowser folders={folders} docs={docs} folderId={folderId} isCEO={isCEO} loading={library.isLoading} error={library.error} navigate={setFolderId} addFolder={openFolderDialog} addDocument={setComposer} preview={openPreview} download={download} edit={openEdit} remove={setDeleteTarget} refresh={refresh} />
    {composer && <DocumentComposer mode={composer} folders={folders} folderId={folderId} onClose={() => setComposer(null)} onSaved={refresh} saveFile={library.saveFile} />}
    <Dialog open={folderDialog} onOpenChange={open => { if (!busy) setFolderDialog(open); }}><DialogContent dir="rtl"><DialogHeader><DialogTitle>{editingFolder ? 'تعديل المجلد' : 'مجلد جديد'}</DialogTitle><DialogDescription>{trail.map(folder => folder.name).join(' / ') || 'المكتبة الرئيسية'}</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="folder-name">اسم المجلد</Label><Input id="folder-name" autoFocus value={name} disabled={busy} onChange={event => setName(event.target.value)} /></div><div className="space-y-2"><Label>داخل المجلد</Label><Select value={parent} onValueChange={setParent} disabled={busy}><SelectTrigger aria-label="المجلد الأب"><SelectValue /></SelectTrigger><SelectContent>{destinations(editingFolder?.id)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="folder-keywords">كلمات مفتاحية</Label><Input id="folder-keywords" value={keywords} disabled={busy} onChange={event => setKeywords(event.target.value)} placeholder="عقود، مالية، مشروع" /></div></div><Button onClick={saveFolder} disabled={busy || !name.trim()}>{busy ? <Loader2 className="animate-spin" /> : <FolderPlus />}حفظ المجلد</Button></DialogContent></Dialog>
    <Dialog open={Boolean(editingDoc)} onOpenChange={open => { if (!open && !busy) setEditingDoc(null); }}><DialogContent dir="rtl"><DialogHeader><DialogTitle>تنظيم الملف</DialogTitle><DialogDescription>{editingDoc?.file_name}</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="edit-name">اسم الملف</Label><Input id="edit-name" value={name} onChange={event => setName(event.target.value)} disabled={busy} /></div><div className="space-y-2"><Label htmlFor="edit-description">الوصف</Label><Textarea id="edit-description" value={description} onChange={event => setDescription(event.target.value)} disabled={busy} /></div><div className="space-y-2"><Label htmlFor="edit-keywords">كلمات مفتاحية</Label><Input id="edit-keywords" value={keywords} onChange={event => setKeywords(event.target.value)} disabled={busy} /></div><Select value={parent} onValueChange={setParent} disabled={busy}><SelectTrigger aria-label="نقل إلى مجلد"><SelectValue /></SelectTrigger><SelectContent>{destinations()}</SelectContent></Select></div><Button onClick={saveEdit} disabled={busy || !name.trim()}>حفظ التغييرات</Button></DialogContent></Dialog>
    <Dialog open={Boolean(preview)} onOpenChange={open => { if (!open) closePreview(); }}><DialogContent dir="rtl" className="max-w-3xl max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle className="break-words">{preview?.title}</DialogTitle><DialogDescription>{preview?.file_name}</DialogDescription></DialogHeader>{previewLoading ? <Loader2 className="mx-auto animate-spin" /> : previewText ? <article className="document-paper p-6 rounded-md border border-border whitespace-pre-wrap break-words leading-8">{previewText}</article> : previewUrl ? <img src={previewUrl} alt={preview?.title} className="max-h-[60dvh] object-contain w-full" /> : <div className="py-8 text-center"><FileText className="size-10 mx-auto text-primary mb-3" /><p className="text-muted-foreground">معاينة هذا النوع متاحة بعد فتح الملف</p>{preview && <Button asChild variant="link"><a href={preview.file_url} target="_blank" rel="noopener noreferrer">فتح الملف</a></Button>}</div>}<Button onClick={() => { if (preview) download(preview); }}><Download />تحميل الملف</Button></DialogContent></Dialog>
    <Dialog open={Boolean(deleteTarget)} onOpenChange={open => { if (!open && !busy) setDeleteTarget(null); }}><DialogContent dir="rtl"><DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle><DialogDescription>هل تريد حذف «{deleteTarget?.name}»؟</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDeleteTarget(null)}>إلغاء</Button><Button variant="destructive" disabled={busy} onClick={remove}><Trash2 />حذف</Button></div></DialogContent></Dialog>
  </div></Layout>;
}
