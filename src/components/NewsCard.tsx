import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ThumbsUp, ThumbsDown, MessageCircle, Pin, Trash2, Send, ChevronDown, ChevronUp,
  Image, Video, FileText, Twitter
} from 'lucide-react';
import { useNewsReactions, useNewsComments, type NewsItem } from '@/hooks/useNews';
import { useAuthContext } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNews } from '@/hooks/useNews';
import { toast } from '@/hooks/use-toast';

const typeIcons: Record<string, React.ReactNode> = {
  text: <FileText className="w-3 h-3" />,
  image: <Image className="w-3 h-3" />,
  video: <Video className="w-3 h-3" />,
  tweet: <Twitter className="w-3 h-3" />,
};

const typeLabels: Record<string, string> = {
  text: 'نص',
  image: 'صورة',
  video: 'فيديو',
  tweet: 'تغريدة',
};

interface Props {
  item: NewsItem;
  isRead: boolean;
  onMarkRead: () => void;
  projects: { id: string; name: string }[];
}

export default function NewsCard({ item, isRead, onMarkRead, projects }: Props) {
  const { user, profile, isCEO } = useAuthContext();
  const { deleteNews } = useNews();
  const { data: reactions = [], toggleReaction } = useNewsReactions(item.id);
  const { data: comments = [], addComment, deleteComment } = useNewsComments(item.id);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Mark as read on mount
  useEffect(() => {
    if (!isRead) onMarkRead();
  }, [isRead, onMarkRead]);

  const myReaction = reactions.find(r => r.user_id === user?.id);
  const likesCount = reactions.filter(r => r.reaction_type === 'like').length;
  const dislikesCount = reactions.filter(r => r.reaction_type === 'dislike').length;

  const projectName = item.project_id ? projects.find(p => p.id === item.project_id)?.name : null;

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await addComment.mutateAsync({
      content: commentText,
      user_name: profile?.display_name || 'مجهول',
      user_avatar: profile?.avatar_url || undefined,
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
    <Card className={`transition-all duration-300 hover:shadow-md ${!isRead ? 'border-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.1)]' : ''}`}>
      <CardContent className="p-5 space-y-3" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={item.author_avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {item.author_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-foreground">{item.author_name}</span>
                {item.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                {!isRead && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">جديد</Badge>}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{timeAgo}</span>
                <span className="flex items-center gap-1">{typeIcons[item.content_type]} {typeLabels[item.content_type]}</span>
                {projectName && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{projectName}</Badge>
                )}
                <span className="text-muted-foreground/50">#{item.news_number}</span>
              </div>
            </div>
          </div>
          {(isCEO || item.author_id === user?.id) && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/60 hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Title & Content */}
        <div>
          <h3 className="font-heading font-bold text-base text-foreground mb-1">{item.title}</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{item.content}</p>
        </div>

        {/* Media */}
        {item.media_url && item.content_type === 'image' && (
          <img src={item.media_url} alt={item.title} className="w-full max-h-80 object-cover rounded-lg" />
        )}
        {item.media_url && item.content_type === 'video' && (
          <video src={item.media_url} controls className="w-full max-h-80 rounded-lg" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 text-xs ${myReaction?.reaction_type === 'like' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
            onClick={() => toggleReaction.mutate('like')}
          >
            <ThumbsUp className="w-4 h-4" />
            {likesCount > 0 && likesCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 text-xs ${myReaction?.reaction_type === 'dislike' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground'}`}
            onClick={() => toggleReaction.mutate('dislike')}
          >
            <ThumbsDown className="w-4 h-4" />
            {dislikesCount > 0 && dislikesCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4" />
            {item.comments_count > 0 && item.comments_count}
            {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-3 pt-2 border-t border-border">
            {comments.map(c => (
              <div key={c.id} className="flex items-start gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={c.user_avatar || undefined} />
                  <AvatarFallback className="text-[10px] bg-secondary">{c.user_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-secondary/50 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{c.user_name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ar })}
                      </span>
                      {(isCEO || c.user_id === user?.id) && (
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteComment.mutate(c.id)}>
                          <Trash2 className="w-3 h-3 text-destructive/60" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
            {/* Add comment */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="أضف تعليقاً..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                className="text-xs h-8"
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleComment} disabled={addComment.isPending}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
