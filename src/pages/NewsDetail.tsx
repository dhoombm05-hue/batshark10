import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useNews, useNewsReactions, useNewsComments, useNewsReadStatus, type NewsItem } from '@/hooks/useNews';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ThumbsUp, ThumbsDown, MessageCircle, Pin, Trash2, Send,
  ArrowRight, Image, Video, FileText, Twitter, ZoomIn, ZoomOut, X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  text: { icon: <FileText className="w-3.5 h-3.5" />, label: 'نص', color: 'bg-primary/10 text-primary' },
  image: { icon: <Image className="w-3.5 h-3.5" />, label: 'صورة', color: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' },
  video: { icon: <Video className="w-3.5 h-3.5" />, label: 'فيديو', color: 'bg-[hsl(var(--purple))]/10 text-[hsl(var(--purple))]' },
  tweet: { icon: <Twitter className="w-3.5 h-3.5" />, label: 'تغريدة', color: 'bg-[hsl(210,80%,52%)]/10 text-[hsl(210,80%,52%)]' },
};

function ImageViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}>
          {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
        </Button>
        <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      <img
        src={src}
        alt={alt}
        onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}
        className={`max-w-full max-h-full rounded-xl shadow-2xl transition-transform duration-300 cursor-zoom-in ${zoomed ? 'scale-150 cursor-zoom-out' : ''}`}
      />
    </motion.div>
  );
}

function PostReactions({ item, newsId }: { item: NewsItem; newsId: string }) {
  const { user } = useAuthContext();
  const { data: reactions = [], toggleReaction } = useNewsReactions(newsId);
  const myReaction = reactions.find(r => r.user_id === user?.id);
  const likesCount = reactions.filter(r => r.reaction_type === 'like').length;
  const dislikesCount = reactions.filter(r => r.reaction_type === 'dislike').length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        className={`gap-2 rounded-xl transition-all ${
          myReaction?.reaction_type === 'like'
            ? 'border-primary bg-primary/10 text-primary font-bold'
            : 'text-muted-foreground hover:text-primary hover:border-primary/40'
        }`}
        onClick={() => toggleReaction.mutate('like')}
      >
        <ThumbsUp className="w-4 h-4" />
        <span>{likesCount}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={`gap-2 rounded-xl transition-all ${
          myReaction?.reaction_type === 'dislike'
            ? 'border-destructive bg-destructive/10 text-destructive font-bold'
            : 'text-muted-foreground hover:text-destructive hover:border-destructive/40'
        }`}
        onClick={() => toggleReaction.mutate('dislike')}
      >
        <ThumbsDown className="w-4 h-4" />
        <span>{dislikesCount}</span>
      </Button>
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm mr-2">
        <MessageCircle className="w-4 h-4" />
        <span>{item.comments_count} تعليق</span>
      </div>
    </div>
  );
}

function PostComments({ newsId }: { newsId: string }) {
  const { user, profile, isCEO } = useAuthContext();
  const { data: comments = [], addComment, deleteComment } = useNewsComments(newsId);
  const [commentText, setCommentText] = useState('');

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await addComment.mutateAsync({
      content: commentText,
      user_name: profile?.display_name || 'مستخدم',
      user_avatar: profile?.avatar_url || undefined,
    });
    setCommentText('');
  };

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        التعليقات ({comments.length})
      </h3>

      {/* Add comment */}
      <div className="flex items-start gap-3">
        <Avatar className="w-9 h-9 mt-0.5">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
            {profile?.display_name?.charAt(0) || '؟'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder="أضف تعليقاً..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleComment()}
            className="rounded-xl bg-muted/50 border-border focus-visible:ring-1"
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl"
            onClick={handleComment}
            disabled={addComment.isPending || !commentText.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        <AnimatePresence>
          {comments.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-3"
            >
              <Avatar className="w-9 h-9 mt-0.5">
                <AvatarImage src={c.user_avatar || undefined} />
                <AvatarFallback className="text-xs bg-secondary font-bold">{c.user_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted/40 rounded-2xl p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-foreground">{c.user_name}</span>
                    {c.user_job_title && (
                      <span className="text-[11px] text-muted-foreground mr-2">• {c.user_job_title}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ar })}
                    </span>
                    {(isCEO || c.user_id === user?.id) && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => deleteComment.mutate(c.id)}>
                        <Trash2 className="w-3 h-3 text-destructive/60" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">{c.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground/60">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">لا توجد تعليقات بعد — كن أول من يعلّق!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isCEO } = useAuthContext();
  const { data: news = [], deleteNews } = useNews();
  const { data: projects = [] } = useProjects();
  const { readIds, markAsRead } = useNewsReadStatus();
  const [showViewer, setShowViewer] = useState(false);
  const markReadRef = useRef<string | null>(null);

  const item = news.find(n => n.id === id);

  useEffect(() => {
    if (!id || !item) return;
    if (readIds.includes(id)) return;
    if (markReadRef.current === id) return;

    markReadRef.current = id;
    markAsRead.mutate(id);
  }, [id, item, readIds]);

  if (!item) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 text-center" dir="rtl">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-heading font-bold text-muted-foreground">لم يتم العثور على المنشور</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/news')}>
            <ArrowRight className="w-4 h-4" />
            العودة للأخبار
          </Button>
        </div>
      </Layout>
    );
  }

  const type = typeConfig[item.content_type] || typeConfig.text;
  const projectName = item.project_id ? projects.find(p => p.id === item.project_id)?.name : null;
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ar });

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    await deleteNews.mutateAsync(item.id);
    toast({ title: '🗑️ تم حذف الخبر' });
    navigate('/news');
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
        {/* Back */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => navigate('/news')}>
            <ArrowRight className="w-4 h-4" />
            العودة للأخبار
          </Button>
        </motion.div>

        {/* Main Post Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden border-border shadow-lg">
            <CardContent className="p-0">
              {/* Author Header */}
              <div className="p-6 pb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 ring-2 ring-border shadow-md">
                    <AvatarImage src={item.author_avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-[hsl(var(--royal))] text-white text-lg font-bold">
                      {item.author_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-heading font-bold text-lg text-foreground">{item.author_name}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap mt-0.5">
                      {item.author_job_title && (
                        <>
                          <span>{item.author_job_title}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        </>
                      )}
                      <span>{timeAgo}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${type.color}`}>
                        {type.icon} {type.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.is_pinned && (
                        <Badge variant="outline" className="text-[11px] gap-1 border-[hsl(var(--gold))]/40 text-[hsl(var(--gold))]">
                          <Pin className="w-3 h-3" /> مثبت
                        </Badge>
                      )}
                      {projectName && (
                        <Badge variant="outline" className="text-[11px] font-bold">{projectName}</Badge>
                      )}
                      <span className="text-muted-foreground/40 text-xs font-mono">#{item.news_number}</span>
                    </div>
                  </div>
                </div>
                {(isCEO || item.author_id === user?.id) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Content */}
              <div className="px-6 pb-4">
                <h1 className="font-heading font-black text-xl text-foreground mb-3 leading-snug">{item.title}</h1>
                <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">{item.content}</p>
              </div>

              {/* Full-Size Media */}
              {item.media_url && item.content_type === 'image' && (
                <div
                  className="relative cursor-pointer group"
                  onClick={() => setShowViewer(true)}
                >
                  <img
                    src={item.media_url}
                    alt={item.title}
                    className="w-full max-h-[70vh] object-contain bg-muted/30 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white rounded-full p-3">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              )}
              {item.media_url && item.content_type === 'video' && (
                <div className="bg-black">
                  <video
                    src={item.media_url}
                    controls
                    className="w-full max-h-[70vh]"
                    controlsList="nodownload"
                  />
                </div>
              )}

              {/* Reactions Bar */}
              <div className="px-6 py-4 border-t border-border">
                <PostReactions item={item} newsId={item.id} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comments Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border">
            <CardContent className="p-6">
              <PostComments newsId={item.id} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {showViewer && item.media_url && (
          <ImageViewer src={item.media_url} alt={item.title} onClose={() => setShowViewer(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
