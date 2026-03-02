import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Plus, Send, Hash, Lock, FolderKanban, Shield,
  Search, Reply, Paperclip, X, Trash2, Users
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatRooms, useChatMessages, type ChatRoom, type ChatMessage } from '@/hooks/useChatRooms';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const ROOM_ICONS: Record<string, React.ReactNode> = {
  general: <Hash className="w-4 h-4" />,
  private: <Lock className="w-4 h-4" />,
  project: <FolderKanban className="w-4 h-4" />,
  admin: <Shield className="w-4 h-4" />,
};

const ROOM_COLORS: Record<string, string> = {
  general: 'text-section-ai',
  private: 'text-section-forecast',
  project: 'text-section-revenue',
  admin: 'text-section-employees',
};

export default function ChatRooms() {
  const { rooms, loading: roomsLoading, createRoom, deleteRoom } = useChatRooms();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const { messages, loading: msgsLoading, sendMessage } = useChatMessages(selectedRoom?.id || null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('general');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const { user, isCEO } = useAuthContext();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-select first room
  useEffect(() => {
    if (!selectedRoom && rooms.length > 0) setSelectedRoom(rooms[0]);
  }, [rooms, selectedRoom]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input, replyTo?.id);
    setInput('');
    setReplyTo(null);
  }, [input, replyTo, sendMessage]);

  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim()) return;
    await createRoom(newRoomName, newRoomType, newRoomDesc);
    setNewRoomName('');
    setNewRoomType('general');
    setNewRoomDesc('');
    setNewRoomOpen(false);
  }, [newRoomName, newRoomType, newRoomDesc, createRoom]);

  const filteredMessages = search
    ? messages.filter(m => m.content.includes(search) || m.user_name.includes(search))
    : messages;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-section-ai/15">
            <MessageSquare className="w-6 h-6 text-section-ai" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">غرفة النقاشات</h1>
            <p className="text-sm text-muted-foreground">تواصل مع فريق العمل في الوقت الفعلي</p>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-4 bg-gradient-card rounded-2xl border border-border shadow-card overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Rooms Sidebar */}
        <div className="w-72 border-l border-border flex flex-col shrink-0">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-foreground">الغرف</h3>
            <Dialog open={newRoomOpen} onOpenChange={setNewRoomOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">إنشاء غرفة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <Input
                    placeholder="اسم الغرفة"
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                  />
                  <Select value={newRoomType} onValueChange={setNewRoomType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">🌐 عامة</SelectItem>
                      <SelectItem value="private">🔒 خاصة</SelectItem>
                      <SelectItem value="project">📁 مشروع</SelectItem>
                      <SelectItem value="admin">🛡️ إدارية</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="وصف الغرفة (اختياري)"
                    value={newRoomDesc}
                    onChange={e => setNewRoomDesc(e.target.value)}
                  />
                  <Button onClick={handleCreateRoom} className="w-full">إنشاء الغرفة</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {roomsLoading ? (
              <p className="text-xs text-muted-foreground text-center py-4">جاري التحميل...</p>
            ) : rooms.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">لا توجد غرف بعد</p>
            ) : (
              rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-right transition-all ${
                    selectedRoom?.id === room.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-secondary/50 border border-transparent'
                  }`}
                >
                  <span className={ROOM_COLORS[room.type] || 'text-muted-foreground'}>
                    {ROOM_ICONS[room.type] || <Hash className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{room.name}</p>
                    {room.description && (
                      <p className="text-[10px] text-muted-foreground truncate">{room.description}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedRoom ? (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={ROOM_COLORS[selectedRoom.type]}>
                    {ROOM_ICONS[selectedRoom.type]}
                  </span>
                  <h3 className="font-heading font-bold text-foreground">{selectedRoom.name}</h3>
                  {selectedRoom.description && (
                    <span className="text-xs text-muted-foreground">— {selectedRoom.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="بحث..."
                      className="text-xs bg-secondary/30 border border-border rounded-md pr-7 pl-2 py-1.5 w-36 focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  {(isCEO || selectedRoom.created_by === user?.id) && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => { deleteRoom(selectedRoom.id); setSelectedRoom(null); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">جاري تحميل الرسائل...</p>
                ) : filteredMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">لا توجد رسائل بعد، ابدأ المحادثة!</p>
                ) : (
                  filteredMessages.map((msg) => {
                    const isOwn = msg.user_id === user?.id;
                    const replyMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[75%] ${isOwn ? 'order-1' : 'order-2'}`}>
                          {/* Reply preview */}
                          {replyMsg && (
                            <div className="text-[10px] bg-secondary/30 rounded-t-lg px-3 py-1 border-r-2 border-primary/40 text-muted-foreground mb-0.5">
                              <span className="font-bold">{replyMsg.user_name}</span>: {replyMsg.content.slice(0, 50)}...
                            </div>
                          )}
                          <div className={`rounded-xl px-4 py-2.5 ${
                            isOwn
                              ? 'bg-primary/15 text-foreground rounded-br-sm'
                              : 'bg-secondary/50 border border-border text-foreground rounded-bl-sm'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-heading font-bold text-primary">{msg.user_name}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(msg.created_at), 'hh:mm a', { locale: ar })}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            {msg.file_url && (
                              <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline flex items-center gap-1 mt-1">
                                <Paperclip className="w-3 h-3" /> {msg.file_name || 'ملف مرفق'}
                              </a>
                            )}
                          </div>
                          <button
                            onClick={() => setReplyTo(msg)}
                            className="text-[10px] text-muted-foreground hover:text-primary mt-0.5 flex items-center gap-1 transition-colors"
                          >
                            <Reply className="w-3 h-3" /> رد
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Reply indicator */}
              <AnimatePresence>
                {replyTo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-2 bg-secondary/20 border-t border-border flex items-center gap-2"
                  >
                    <Reply className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground flex-1 truncate">
                      رد على <strong>{replyTo.user_name}</strong>: {replyTo.content.slice(0, 40)}...
                    </span>
                    <button onClick={() => setReplyTo(null)}>
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className="p-3 border-t border-border flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="اكتب رسالة..."
                  className="flex-1 bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <Button onClick={handleSend} size="icon" disabled={!input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">اختر غرفة للبدء بالمحادثة</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
