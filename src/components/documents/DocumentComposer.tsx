import { useRef, useState } from 'react';
import { FilePlus2, Upload, FileText, Loader2, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { parseKeywords, folderTrail, type DocumentFolder } from '@/lib/document-utils';
import { createDocumentFile, type CreatedFileType } from '@/lib/create-document';
import { toast } from 'sonner';
import logo from '@/assets/batshark-logo-official.png';

export const DOCUMENT_CATEGORIES = [
  ['general', 'عام'], ['financial', 'مالي'], ['legal', 'قانوني'], ['investment', 'استثماري'],
  ['projects', 'مشاريع'], ['hr', 'موارد بشرية'], ['operations', 'تشغيل'], ['contracts', 'عقود'],
];

interface Props {
  mode: 'import' | 'create';
  folderId: string | null;
  folders: DocumentFolder[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  saveFile: (file: File, metadata: { title: string; description: string; category: string; folder_id: string | null; keywords: string[]; content?: string; source: string }) => Promise<void>;
}

export default function DocumentComposer({ mode, folderId, folders, onClose, onSaved, saveFile }: Props) {
  const [tab, setTab] = useState(mode);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [destination, setDestination] = useState(folderId || 'root');
  const [category, setCategory] = useState('general');
  const [type, setType] = useState<CreatedFileType>('pdf');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const chooseFiles = (incoming: File[]) => {
    setFiles(incoming);
    if (!title && incoming.length === 1) setTitle(incoming[0].name.replace(/\.[^.]+$/, ''));
  };
  const submit = async () => {
    if ((tab === 'create' && (!title.trim() || !content.trim())) || (tab === 'import' && !files.length)) return;
    setBusy(true);
    let saved = 0;
    try {
      const pending = tab === 'create' ? [await createDocumentFile(title, content, type)] : files;
      for (const file of pending) {
        setProgress(`حفظ ${saved + 1} من ${pending.length}`);
        await saveFile(file, { title: pending.length === 1 ? title.trim() || file.name.replace(/\.[^.]+$/, '') : file.name.replace(/\.[^.]+$/, ''), description, category, folder_id: destination === 'root' ? null : destination, keywords: parseKeywords(keywords), content: tab === 'create' ? content : undefined, source: tab });
        saved++;
        if (tab === 'import') setFiles(current => current.filter(item => item !== file));
      }
      await onSaved();
      toast.success(tab === 'create' ? 'تم إنشاء المستند وحفظه' : `تم حفظ ${saved} ملف`);
      onClose();
    } catch (error) {
      if (saved) await onSaved();
      toast.error(saved ? `تم حفظ ${saved} ملف؛ أعد محاولة الملفات المتبقية` : 'تعذر حفظ الملف، بقي المحتوى متاحاً لإعادة المحاولة');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent dir="rtl" className="max-w-3xl max-h-[90dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>إضافة إلى مكتبة الملفات</DialogTitle><DialogDescription>{folderTrail(folders, folderId).map(folder => folder.name).join(' / ') || 'المكتبة الرئيسية'}</DialogDescription></DialogHeader>
      <Tabs value={tab} onValueChange={value => { if (!busy) setTab(value as 'import' | 'create'); }}>
        <TabsList className="grid grid-cols-2 w-full h-12"><TabsTrigger value="import" className="gap-2"><Upload className="size-4" />استيراد ملف</TabsTrigger><TabsTrigger value="create" className="gap-2"><FilePlus2 className="size-4" />إنشاء مستند</TabsTrigger></TabsList>
        <TabsContent value="import" className="space-y-3">
          <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!busy) chooseFiles(Array.from(event.dataTransfer.files)); }} className="border border-dashed border-primary/40 rounded-lg bg-secondary/30 py-8 text-center">
            <Upload className="size-8 text-primary mx-auto mb-3" /><Button variant="outline" onClick={() => ref.current?.click()} disabled={busy}>اختيار الملفات</Button>
            <p className="text-xs text-muted-foreground mt-3">PDF · Word · Excel · صور · ملفات نصية</p>
            <input ref={ref} type="file" multiple className="hidden" aria-label="اختيار ملفات للاستيراد" disabled={busy} onChange={event => { chooseFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
          </div>
          {files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center gap-2 border-b border-border py-2"><FileText className="size-4 text-primary shrink-0" /><span className="text-sm truncate flex-1">{file.name}</span><span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span><Button size="icon" variant="ghost" aria-label={`إزالة ${file.name}`} disabled={busy} onClick={() => setFiles(current => current.filter((_, i) => i !== index))}><X /></Button></div>)}
        </TabsContent>
        <TabsContent value="create" className="space-y-4">
          <div className="space-y-2"><Label>نوع المستند</Label><Select value={type} onValueChange={value => setType(value as CreatedFileType)} disabled={busy}><SelectTrigger aria-label="نوع المستند"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pdf">PDF — مستند رسمي</SelectItem><SelectItem value="docx">Word — قابل للتحرير</SelectItem><SelectItem value="xlsx">Excel — جدول بيانات</SelectItem><SelectItem value="txt">TXT — نص</SelectItem><SelectItem value="md">Markdown</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><div className="flex justify-between items-center"><Label htmlFor="document-content">محتوى المستند</Label><Button size="sm" variant="ghost" onClick={() => setPreview(!preview)}><Eye />{preview ? 'التحرير' : 'معاينة'}</Button></div>
            {preview ? <article className="document-paper border border-border rounded-md p-6 min-h-60"><img src={logo} alt="BatShark" className="size-14 object-contain mb-4" /><h2 className="font-heading text-xl font-bold mb-4 break-words">{title}</h2><p className="whitespace-pre-wrap break-words leading-8">{content}</p></article> : <Textarea id="document-content" value={content} onChange={event => setContent(event.target.value)} disabled={busy} rows={9} className="leading-8" />}
          </div>
        </TabsContent>
      </Tabs>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="document-title">اسم المستند{files.length > 1 ? ' (تُستخدم أسماء الملفات)' : ''}</Label><Input id="document-title" value={title} onChange={event => setTitle(event.target.value)} disabled={busy || (tab === 'import' && files.length > 1)} /></div>
        <div className="space-y-2"><Label>المجلد</Label><Select value={destination} onValueChange={setDestination} disabled={busy}><SelectTrigger aria-label="مجلد الحفظ"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="root">المكتبة الرئيسية</SelectItem>{folders.map(folder => <SelectItem key={folder.id} value={folder.id}>{folderTrail(folders, folder.id).map(item => item.name).join(' / ')}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>التصنيف</Label><Select value={category} onValueChange={setCategory} disabled={busy}><SelectTrigger aria-label="تصنيف المستند"><SelectValue /></SelectTrigger><SelectContent>{DOCUMENT_CATEGORIES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="document-keywords">كلمات مفتاحية</Label><Input id="document-keywords" value={keywords} onChange={event => setKeywords(event.target.value)} placeholder="عقود، شراكة، بادل" disabled={busy} /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="document-description">الوصف</Label><Textarea id="document-description" rows={2} value={description} onChange={event => setDescription(event.target.value)} disabled={busy} /></div>
      </div>
      <div className="flex gap-2 justify-end border-t border-border pt-4"><Button variant="outline" disabled={busy} onClick={onClose}>إلغاء</Button><Button onClick={submit} disabled={busy || (tab === 'create' ? !title.trim() || !content.trim() : !files.length)}>{busy ? <Loader2 className="animate-spin" /> : tab === 'create' ? <FilePlus2 /> : <Upload />}{busy ? progress || 'تجهيز المستند...' : tab === 'create' ? 'إنشاء وحفظ' : 'استيراد وحفظ'}</Button></div>
    </DialogContent>
  </Dialog>;
}