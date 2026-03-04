import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ThumbsUp, ThumbsDown, MessageCircle, Pin, Trash2, Send, ChevronDown, ChevronUp,
  Image, Video, FileText, Twitter, Eye
} from 'lucide-react';
import { useNewsReactions, useNewsComments, type NewsItem } from '@/hooks/useNews';
import { useAuthContext } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNews } from '@/hooks/useNews';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  text: { icon: <FileText className="w-3 h-3" />, label: 'نص', color: 'bg-primary/10 text-primary' },
  image: { icon: <Image className="w-3 h-3" />, label: 'صورة', color: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' },
  video: { icon: <Video className="w-3 h-3" />, label: 'فيديو', color: 'bg-[hsl(var(--purple))]/10 text-[hsl(var(--purple))]' },
  tweet: { icon: <Twitter className="w-3 h-3" />, label: 'تغريدة', color: 'bg-[hsl(210,80%,52%)]/10 text-[hsl(210,80%,52%)]' },
};

interface Props {
  item: NewsItem;
  isRead: boolean;
  onMarkRead: () => void;
  projects: { id: string; name: string }[];
  compact?: boolean;
}

export default function NewsCard({ item, isRead, onMarkRead, projects, compact }: Props) {
  const { user, profile: myProfile, isCEO } = useAuthContext();
  const { deleteNews } = useNews();
  const { data: reactions = [], toggleReaction } = useNewsReactions(item.id);
  const { data: comments = [], addComment, deleteComment } = useNewsComments(item.id);

  const authorName = item.author_name;
  const authorAvatar = item.author_avatar;
  const authorTitle = item.author_job_title;
  
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const markedRef = useRef(false);
  useEffect(() => {
    if (!isRead && !markedRef.current) {
      markedRef.current = true;
      onMarkRead();
    }
  }, [isRead]);

  const myReaction = reactions.find(r => r.user_id === user?.id);
  const likesCount = reactions.filter(r => r.reaction_type === 'like').length;
  const dislikesCount = reactions.filter(r => r.reaction_type === 'dislike').length;
  const projectName = item.project_id ? projects.find(p => p.id === item.project_id)?.name : null;
  const type = typeConfig[item.content_type] || typeConfig.text;

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await addComment.mutateAsync({
      content: commentText,
      user_name: myProfile?.display_name || 'مجهول',
      user_avatar: myProfile?.avatar_url || undefined,
    });
    setCommentText('');
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    await deleteNews.mutateAsync(item.id);
    toast({ title: '🗑️ تم حذف الخبر' });
  };

  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ar });

  return (
    <Card className={`group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border overflow-hidden ${
      !isRead ? 'border-primary/30 bg-gradient-to-l from-primary/[0.03] to-transparent' : 'border-border'
    }`}>
      <CardContent className={`${compact ? 'p-4' : 'p-5 sm:p-6'} space-y-3`} dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-11 h-11 ring-2 ring-border">
                <AvatarImage src={authorAvatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-[hsl(var(--royal))] text-white text-sm font-bold">
                  {authorName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {!isRead && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive rounded-full border-2 border-card animate-pulse" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading font-bold text-sm text-foreground">{authorName}</span>
                {authorTitle && (
                  <span className="text-[10px] text-muted-foreground font-medium">• {authorTitle}</span>
                )}
                {item.is_pinned && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 border-[hsl(var(--gold))]/40 text-[hsl(var(--gold))]">
                    <Pin className="w-2.5 h-2.5" /> مثبت
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                <span>{timeAgo}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${type.color}`}>
                  {type.icon} {type.label}
                </span>
                {projectName && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold">{projectName}</Badge>
                  </>
                )}
                <span className="text-muted-foreground/40 font-mono">#{item.news_number}</span>
              </div>
            </div>
          </div>
          {(isCEO || item.author_id === user?.id) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive/60 hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="font-heading font-bold text-base text-foreground mb-1.5 leading-snug">{item.title}</h3>
          <p className={`text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed ${compact ? 'line-clamp-3' : ''}`}>
            {item.content}
          </p>
        </div>

        {/* Media */}
        {item.media_url && item.content_type === 'image' && (
          <div className="relative overflow-hidden rounded-xl group/media">
            <img
              src={item.media_url}
              alt={item.title}
              className="w-full max-h-96 object-cover transition-transform duration-500 group-hover/media:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity flex items-end p-3">
              <span className="text-white/80 text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> عرض</span>
            </div>
          </div>
        )}
        {item.media_url && item.content_type === 'video' && (
          <div className="rounded-xl overflow-hidden bg-black/5">
            <video src={item.media_url} controls className="w-full max-h-96 rounded-xl" />
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center gap-1 pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 text-xs rounded-xl transition-all ${
              myReaction?.reaction_type === 'like'
                ? 'text-primary bg-primary/10 hover:bg-primary/15 font-bold'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
            }`}
            onClick={() => toggleReaction.mutate('like')}
          >
            <ThumbsUp className="w-4 h-4" />
            {likesCount > 0 && <span>{likesCount}</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 text-xs rounded-xl transition-all ${
              myReaction?.reaction_type === 'dislike'
                ? 'text-destructive bg-destructive/10 hover:bg-destructive/15 font-bold'
                : 'text-muted-foreground hover:text-destructive hover:bg-destructive/5'
            }`}
            onClick={() => toggleReaction.mutate('dislike')}
          >
            <ThumbsDown className="w-4 h-4" />
            {dislikesCount > 0 && <span>{dislikesCount}</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 text-xs rounded-xl transition-all ${
              showComments
                ? 'text-primary bg-primary/10 font-bold'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
            }`}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4" />
            {item.comments_count > 0 && <span>{item.comments_count}</span>}
            {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        {/* Comments */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-2 border-t border-border overflow-hidden"
            >
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={c.user_avatar || undefined} />
                    <AvatarFallback className="text-[10px] bg-secondary font-bold">{c.user_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted/50 rounded-xl p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground">{c.user_name}</span>
                        {c.user_job_title && (
                          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{c.user_job_title}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ar })}
                        </span>
                        {(isCEO || c.user_id === user?.id) && (
                          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-50 hover:opacity-100" onClick={() => deleteComment.mutate(c.id)}>
                            <Trash2 className="w-3 h-3 text-destructive/60" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
              {/* Add comment */}
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={myProfile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                    {myProfile?.display_name?.charAt(0) || '؟'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    placeholder="أضف تعليقاً..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                    className="text-xs h-8 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
                  />
                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-xl"
                    onClick={handleComment}
                    disabled={addComment.isPending || !commentText.trim()}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
