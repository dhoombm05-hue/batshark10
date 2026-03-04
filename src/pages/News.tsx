import { useState } from 'react';
import Layout from '@/components/Layout';
import { useNews, useNewsReadStatus } from '@/hooks/useNews';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Newspaper, Plus, Pin, Filter, TrendingUp, Clock, FolderKanban } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import NewsCard from '@/components/NewsCard';

export default function News() {
  const { profile, isCEO } = useAuthContext();
  const { data: news = [], createNews } = useNews();
  const { data: projects = [] } = useProjects();
  const { readIds, markAsRead, unreadCount } = useNewsReadStatus();

  const [showCreate, setShowCreate] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'project'>('latest');
  const [filterProject, setFilterProject] = useState<string>('all');

  // Create form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');

  const unread = unreadCount(news.map(n => n.id));

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
      setTitle(''); setContent(''); setMediaUrl(''); setContentType('text'); setSelectedProject('');
    } catch {
      toast({ title: 'خطأ في النشر', variant: 'destructive' });
    }
  };

  // Sort & filter
  let filtered = [...news];
  if (filterProject !== 'all') {
    filtered = filtered.filter(n => n.project_id === filterProject);
  }
  if (sortBy === 'popular') {
    filtered.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
  }

  return (
    <Layout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(210,80%,52%)] flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">أخبار الشركة</h1>
              <p className="text-sm text-muted-foreground">
                آخر التحديثات والإعلانات
                {unread > 0 && (
                  <Badge variant="destructive" className="mr-2 text-xs">{unread} جديد</Badge>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest"><Clock className="w-3 h-3 inline ml-1" />الأحدث</SelectItem>
                <SelectItem value="popular"><TrendingUp className="w-3 h-3 inline ml-1" />الأكثر تفاعل</SelectItem>
                <SelectItem value="project"><FolderKanban className="w-3 h-3 inline ml-1" />حسب المشروع</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter by project */}
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-40 h-9 text-xs">
                <SelectValue placeholder="كل المشاريع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المشاريع</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Create */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  نشر خبر
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg" dir="rtl">
                <DialogHeader>
                  <DialogTitle>نشر خبر جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="عنوان الخبر" value={title} onChange={e => setTitle(e.target.value)} />
                  <Textarea placeholder="محتوى الخبر..." value={content} onChange={e => setContent(e.target.value)} rows={4} />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">📝 نص</SelectItem>
                        <SelectItem value="image">🖼️ صورة</SelectItem>
                        <SelectItem value="video">🎥 فيديو</SelectItem>
                        <SelectItem value="tweet">🐦 تغريدة</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="مشروع (اختياري)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون مشروع</SelectItem>
                        {projects.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(contentType === 'image' || contentType === 'video') && (
                    <Input placeholder="رابط الوسائط (URL)" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
                  )}
                  <Button onClick={handleCreate} disabled={createNews.isPending} className="w-full">
                    {createNews.isPending ? 'جاري النشر...' : '🚀 نشر'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* News Feed */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Newspaper className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">لا توجد أخبار حالياً</p>
              <p className="text-xs text-muted-foreground/60 mt-1">كن أول من ينشر خبراً!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(item => (
              <NewsCard
                key={item.id}
                item={item}
                isRead={readIds.includes(item.id)}
                onMarkRead={() => markAsRead.mutate(item.id)}
                projects={projects}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
