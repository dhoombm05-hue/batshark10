import { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { useNews, useNewsReadStatus } from '@/hooks/useNews';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Newspaper, Plus, TrendingUp, Clock, FolderKanban, Image, Video, FileText, Twitter,
  Sparkles, LayoutGrid, List, Bell, Upload, X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import NewsCard from '@/components/NewsCard';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

type ViewMode = 'grid' | 'list';
type ContentFilter = 'all' | 'text' | 'image' | 'video' | 'tweet';

export default function News() {
  const { profile, isCEO } = useAuthContext();
  const { data: news = [], createNews } = useNews();
  const { data: projects = [] } = useProjects();
  const { readIds, markAsRead, unreadCount } = useNewsReadStatus();

  const [showCreate, setShowCreate] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<ContentFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState('all');

  // Create form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [category, setCategory] = useState('update');
  const [uploading, setUploading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unread = unreadCount(news.map(n => n.id));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast({ title: 'يرجى رفع صورة أو فيديو فقط', variant: 'destructive' });
      return;
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'الحد الأقصى لحجم الملف 20MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('news-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('news-media')
        .getPublicUrl(fileName);

      setMediaUrl(urlData.publicUrl);
      setContentType(isImage ? 'image' : 'video');
      setMediaPreview(URL.createObjectURL(file));
      toast({ title: '✅ تم رفع الملف بنجاح' });
    } catch (err) {
      console.error(err);
      toast({ title: 'خطأ في رفع الملف', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const clearMedia = () => {
    setMediaUrl('');
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: 'أدخل العنوان والمحتوى', variant: 'destructive' });
      return;
    }
    try {
      await createNews.mutateAsync({
        title,
        content,
        content_type: contentType,
        media_url: mediaUrl || undefined,
        project_id: selectedProject && selectedProject !== 'none' ? selectedProject : undefined,
        author_name: profile?.display_name || 'مجهول',
        author_avatar: profile?.avatar_url || undefined,
      });
      toast({ title: '✅ تم نشر الخبر بنجاح' });
      setShowCreate(false);
      setTitle(''); setContent(''); setMediaUrl(''); setContentType('text');
      setSelectedProject(''); setCategory('update'); setMediaPreview(null);
    } catch {
      toast({ title: 'خطأ في النشر', variant: 'destructive' });
    }
  };

  // Filter & sort
  let filtered = [...news];
  if (activeTab === 'by-project' && filterProject !== 'all') {
    filtered = filtered.filter(n => n.project_id === filterProject);
  } else if (activeTab === 'by-type' && filterType !== 'all') {
    filtered = filtered.filter(n => n.content_type === filterType);
  }
  if (sortBy === 'popular') {
    filtered.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
  }

  const typeFilterButtons: { value: ContentFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'الكل', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { value: 'text', label: 'نصوص', icon: <FileText className="w-3.5 h-3.5" /> },
    { value: 'image', label: 'صور', icon: <Image className="w-3.5 h-3.5" /> },
    { value: 'video', label: 'فيديو', icon: <Video className="w-3.5 h-3.5" /> },
    { value: 'tweet', label: 'تغريدات', icon: <Twitter className="w-3.5 h-3.5" /> },
  ];

  return (
    <Layout>
      <div className="space-y-5" dir="rtl">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(210,70%,45%)] to-[hsl(var(--royal))] p-6 sm:p-8"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Newspaper className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
                  News Explore
                </h1>
                <p className="text-sm text-white/70 mt-0.5">
                  آخر الأخبار والتحديثات من فريق العمل
                  {unread > 0 && (
                    <span className="inline-flex items-center gap-1 mr-2 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white">
                      <Bell className="w-3 h-3" />
                      {unread} جديد
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-36 h-9 text-xs bg-white/10 border-white/10 text-white backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest"><Clock className="w-3 h-3 inline ml-1" />الأحدث</SelectItem>
                  <SelectItem value="popular"><TrendingUp className="w-3 h-3 inline ml-1" />الأكثر تفاعل</SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 bg-white text-[hsl(var(--primary))] hover:bg-white/90 font-bold shadow-lg shadow-black/10">
                    <Plus className="w-4 h-4" />
                    نشر خبر
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-heading font-bold">نشر خبر جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="عنوان الخبر..." value={title} onChange={e => setTitle(e.target.value)} className="text-base font-bold" />
                    <Textarea placeholder="اكتب محتوى الخبر هنا..." value={content} onChange={e => setContent(e.target.value)} rows={4} className="resize-none" />

                    {/* File Upload Area */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground">رفع وسائط (صورة أو فيديو)</label>
                      {mediaPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-border">
                          {contentType === 'image' ? (
                            <img src={mediaPreview} alt="Preview" className="w-full max-h-48 object-cover" />
                          ) : (
                            <video src={mediaPreview} className="w-full max-h-48" controls />
                          )}
                          <button
                            onClick={clearMedia}
                            className="absolute top-2 left-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center gap-2 text-muted-foreground"
                        >
                          {uploading ? (
                            <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          ) : (
                            <Upload className="w-6 h-6" />
                          )}
                          <span className="text-xs font-bold">
                            {uploading ? 'جاري الرفع...' : 'اضغط لرفع صورة أو فيديو'}
                          </span>
                          <span className="text-[10px]">الحد الأقصى 20MB</span>
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>

                    {/* Or paste URL */}
                    {!mediaPreview && (
                      <Input
                        placeholder="أو الصق رابط وسائط (URL)..."
                        value={mediaUrl}
                        onChange={e => {
                          setMediaUrl(e.target.value);
                          if (e.target.value) setContentType('image');
                        }}
                        className="text-xs"
                      />
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground">نوع المحتوى</label>
                        <Select value={contentType} onValueChange={setContentType}>
                          <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">📝 نص</SelectItem>
                            <SelectItem value="image">🖼️ صورة</SelectItem>
                            <SelectItem value="video">🎥 فيديو</SelectItem>
                            <SelectItem value="tweet">🐦 تغريدة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground">المشروع</label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                          <SelectTrigger className="text-xs"><SelectValue placeholder="اختياري" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون مشروع</SelectItem>
                            {projects.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button onClick={handleCreate} disabled={createNews.isPending} className="w-full h-11 font-bold text-sm gap-2">
                      {createNews.isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          جاري النشر...
                        </span>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          نشر الخبر
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList className="bg-card border border-border h-10">
              <TabsTrigger value="all" className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Sparkles className="w-3.5 h-3.5" />
                كل الأخبار
                {news.length > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 h-4 mr-1">{news.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="by-project" className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FolderKanban className="w-3.5 h-3.5" />
                حسب المشروع
              </TabsTrigger>
              <TabsTrigger value="by-type" className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <LayoutGrid className="w-3.5 h-3.5" />
                حسب النوع
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'by-project' && (
              <motion.div
                key="project-filter"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 flex-wrap pt-3"
              >
                <button
                  onClick={() => setFilterProject('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    filterProject === 'all'
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                  }`}
                >
                  كل المشاريع
                </button>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setFilterProject(p.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      filterProject === p.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </motion.div>
            )}
            {activeTab === 'by-type' && (
              <motion.div
                key="type-filter"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 flex-wrap pt-3"
              >
                {typeFilterButtons.map(btn => (
                  <button
                    key={btn.value}
                    onClick={() => setFilterType(btn.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      filterType === btn.value
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                    }`}
                  >
                    {btn.icon}
                    {btn.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <TabsContent value="all" className="mt-4">
            <NewsFeed items={filtered} readIds={readIds} markAsRead={markAsRead} projects={projects} viewMode={viewMode} />
          </TabsContent>
          <TabsContent value="by-project" className="mt-4">
            <NewsFeed items={filtered} readIds={readIds} markAsRead={markAsRead} projects={projects} viewMode={viewMode} />
          </TabsContent>
          <TabsContent value="by-type" className="mt-4">
            <NewsFeed items={filtered} readIds={readIds} markAsRead={markAsRead} projects={projects} viewMode={viewMode} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function NewsFeed({ items, readIds, markAsRead, projects, viewMode }: {
  items: any[];
  readIds: string[];
  markAsRead: any;
  projects: { id: string; name: string }[];
  viewMode: ViewMode;
}) {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 rounded-2xl bg-card border border-border"
      >
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Newspaper className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <p className="text-lg font-heading font-bold text-muted-foreground">لا توجد أخبار حالياً</p>
        <p className="text-sm text-muted-foreground/60 mt-1">كن أول من ينشر خبراً!</p>
      </motion.div>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
      <AnimatePresence mode="popLayout">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            layout
          >
            <NewsCard
              item={item}
              isRead={readIds.includes(item.id)}
              onMarkRead={() => markAsRead.mutate(item.id)}
              projects={projects}
              compact={viewMode === 'grid'}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
