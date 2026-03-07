import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Search, Plus, ArrowRight, Paperclip, Image as ImageIcon, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useConversations, usePrivateMessages, type PrivateConversation } from '@/hooks/usePrivateMessages';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Layout from '@/components/Layout';

// Removed getInitials - use User icon fallback instead

function getAvatarColor(name: string) {
  const colors = [
    'from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)]',
    'from-[hsl(152,60%,40%)] to-[hsl(175,60%,38%)]',
    'from-[hsl(270,60%,55%)] to-[hsl(300,50%,50%)]',
    'from-[hsl(25,85%,52%)] to-[hsl(38,92%,50%)]',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function PrivateMessages() {
  const { conversations, loading, startConversation } = useConversations();
  const [selectedConvo, setSelectedConvo] = useState<PrivateConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuthContext();

  const filtered = conversations.filter(c =>
    !searchQuery || c.other_user?.display_name?.includes(searchQuery)
  );

  return (
    <Layout>
      <div className="h-[calc(100vh-2rem)] flex rounded-2xl overflow-hidden border border-border bg-card shadow-lg m-2">
        {/* Sidebar - Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-l border-border flex flex-col bg-card ${selectedConvo ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">الرسائل الخاصة</h2>
              <NewConversationDialog onStart={async (userId) => {
                const convo = await startConversation(userId);
                if (convo) setSelectedConvo(convo as PrivateConversation);
              }} />
            </div>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-9 bg-muted/50 border-0 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">جاري التحميل...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد محادثات بعد</p>
                <p className="text-xs mt-1">ابدأ محادثة جديدة مع أحد الأعضاء</p>
              </div>
            ) : filtered.map(convo => (
              <button
                key={convo.id}
                onClick={() => setSelectedConvo(convo)}
                className={`w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 text-right ${
                  selectedConvo?.id === convo.id ? 'bg-primary/10' : ''
                }`}
              >
                <div className="relative">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={convo.other_user?.avatar_url || ''} />
                    <AvatarFallback className={`bg-gradient-to-br ${getAvatarColor(convo.other_user?.display_name || '')} text-white`}>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  {(convo.unread_count || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {convo.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-foreground truncate">{convo.other_user?.display_name}</span>
                    {convo.last_message_at && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {format(new Date(convo.last_message_at), 'hh:mm a', { locale: ar })}
                      </span>
                    )}
                  </div>
                  {convo.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{convo.last_message}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConvo ? (
          <ChatArea
            conversation={selectedConvo}
            onBack={() => setSelectedConvo(null)}
          />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">اختر محادثة</p>
              <p className="text-sm">أو ابدأ محادثة جديدة</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function ChatArea({ conversation, onBack }: { conversation: PrivateConversation; onBack: () => void }) {
  const { messages, loading, sendMessage } = usePrivateMessages(conversation.id);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthContext();
  const [profileMap, setProfileMap] = useState<Map<string, any>>(new Map());

  // Fetch profiles for sender avatars
  useEffect(() => {
    const ids = [...new Set(messages.map(m => m.sender_id))];
    if (ids.length === 0) return;
    supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', ids).then(({ data }) => {
      setProfileMap(new Map((data || []).map((p: any) => [p.user_id, p])));
    });
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const other = conversation.other_user;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-3 bg-card">
        <button onClick={onBack} className="md:hidden p-1">
          <ArrowRight className="w-5 h-5 text-foreground" />
        </button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={other?.avatar_url || ''} />
          <AvatarFallback className={`bg-gradient-to-br ${getAvatarColor(other?.display_name || '')} text-white`}>
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm text-foreground">{other?.display_name}</p>
          {other?.job_title && <p className="text-xs text-muted-foreground">{other.job_title}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-8">جاري التحميل...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>👋 ابدأ المحادثة</p>
          </div>
        ) : messages.map(msg => {
          const isMine = msg.sender_id === user?.id;
          const senderProfile = profileMap.get(msg.sender_id);
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar — always visible for every message */}
              <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                <AvatarImage src={isMine ? (profileMap.get(msg.sender_id)?.avatar_url || '') : (senderProfile?.avatar_url || other?.avatar_url || '')} />
                <AvatarFallback className={`bg-gradient-to-br ${getAvatarColor(senderProfile?.display_name || other?.display_name || '')} text-white`}>
                  <User className="w-3.5 h-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                isMine
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              }`}>
                {msg.file_url && msg.message_type === 'image' && (
                  <img src={msg.file_url} alt="" className="rounded-lg max-w-full mb-1.5" />
                )}
                {msg.file_url && msg.message_type === 'file' && (
                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="text-xs underline block mb-1">
                    📎 {msg.file_name || 'ملف'}
                  </a>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <span className={`text-[10px] mt-1 block ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {format(new Date(msg.created_at), 'hh:mm a', { locale: ar })}
                  {isMine && msg.is_read && ' ✓✓'}
                </span>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex gap-2 items-center">
          <FileUploadButton conversationId={conversation.id} onUpload={sendMessage} />
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="اكتب رسالة..."
            className="flex-1 bg-muted/50 border-0"
            dir="auto"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="rounded-full bg-primary hover:bg-primary/90">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function FileUploadButton({ conversationId, onUpload }: { conversationId: string; onUpload: (content: string, fileUrl?: string, fileName?: string, type?: string) => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `private/${conversationId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('documents').upload(path, file);
    if (error) return;
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
    const isImage = file.type.startsWith('image/');
    await onUpload(file.name, urlData.publicUrl, file.name, isImage ? 'image' : 'file');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept="image/*,.pdf,.doc,.docx" />
      <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} className="text-muted-foreground hover:text-foreground">
        <Paperclip className="w-4 h-4" />
      </Button>
    </>
  );
}

function NewConversationDialog({ onStart }: { onStart: (userId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const { user } = useAuthContext();

  useEffect(() => {
    if (!open) return;
    supabase.from('profiles').select('user_id, display_name, avatar_url, job_title').then(({ data }) => {
      setUsers((data || []).filter((p: any) => p.user_id !== user?.id));
    });
  }, [open, user]);

  const filtered = users.filter(u => !search || u.display_name?.includes(search));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="text-primary"><Plus className="w-5 h-5" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>محادثة جديدة</DialogTitle>
        </DialogHeader>
        <Input placeholder="بحث عن عضو..." value={search} onChange={e => setSearch(e.target.value)} className="mb-3" />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filtered.map(u => (
            <button
              key={u.user_id}
              onClick={() => { onStart(u.user_id); setOpen(false); }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-right"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={u.avatar_url || ''} />
                <AvatarFallback className={`bg-gradient-to-br ${getAvatarColor(u.display_name || '')} text-white`}>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{u.display_name}</p>
                {u.job_title && <p className="text-xs text-muted-foreground">{u.job_title}</p>}
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">لا يوجد أعضاء</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
