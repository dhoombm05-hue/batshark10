import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Plus, Send, Hash, Lock, FolderKanban, Shield,
  Search, Reply, Paperclip, X, Trash2, Pin, PinOff,
  Pencil, Check, SmilePlus, Brain, Volume2, Image as ImageIcon,
  ArrowRight, Users as UsersIcon, Settings, User
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatRooms, useChatMessages, type ChatRoom, type ChatMessage } from '@/hooks/useChatRooms';
import RoomSettingsDialog from '@/components/RoomSettingsDialog';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUserPreferences, useUpdatePreferences, useUploadThemeImage } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

const ROOM_BG: Record<string, string> = {
  general: 'from-[hsl(190,80%,45%/0.1)] to-[hsl(210,80%,52%/0.05)]',
  private: 'from-[hsl(270,60%,55%/0.1)] to-[hsl(270,60%,55%/0.03)]',
  project: 'from-[hsl(152,60%,40%/0.1)] to-[hsl(152,60%,40%/0.03)]',
  admin: 'from-[hsl(25,85%,52%/0.1)] to-[hsl(25,85%,52%/0.03)]',
};

const QUICK_REACTIONS = ['👍', '❤️', '🔥', '⚡', '✅', '👏', '💡', '🎯'];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    'from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)]',
    'from-[hsl(152,60%,40%)] to-[hsl(175,60%,38%)]',
    'from-[hsl(270,60%,55%)] to-[hsl(300,50%,50%)]',
    'from-[hsl(25,85%,52%)] to-[hsl(38,92%,50%)]',
    'from-[hsl(43,65%,50%)] to-[hsl(25,85%,52%)]',
    'from-[hsl(0,72%,55%)] to-[hsl(330,60%,50%)]',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function isAdminMessage(userName: string) {
  const adminKeywords = ['ceo', 'عبدالرحمن', 'admin', 'رئيس', 'مدير'];
  return adminKeywords.some(k => userName.toLowerCase().includes(k));
}

function stripMarkdown(md: string): string {
  return md.replace(/#{1,6}\s/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/- /g, '، ').replace(/\n+/g, '. ').replace(/[|]/g, '،').trim();
}

// Build avatar and info maps by user_id using profiles + roles
function useUserAvatarMap() {
  const { data: employees } = useEmployees();
  const [profileMap, setProfileMap] = useState<Map<string, { avatar_url: string | null; display_name: string; position?: string }>>(new Map());
  const [ceoSet, setCeoSet] = useState<Set<string>>(new Set());

  // Fetch all profiles + CEO roles once
  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('user_id, display_name, avatar_url, job_title'),
      supabase.from('user_roles').select('user_id, role').eq('role', 'ceo'),
    ]).then(([{ data: profiles }, { data: roles }]) => {
      const map = new Map<string, { avatar_url: string | null; display_name: string; position?: string }>();
      (profiles || []).forEach((p: any) => {
        map.set(p.user_id, { avatar_url: p.avatar_url, display_name: p.display_name, position: p.job_title });
      });
      setProfileMap(map);
      setCeoSet(new Set((roles || []).map((r: any) => r.user_id)));
    });
  }, []);

  // Employee fallback maps
  const employeeAvatarMap = new Map<string, string>();
  employees?.forEach(emp => {
    if (emp.avatar_url) employeeAvatarMap.set(emp.name, emp.avatar_url);
  });

  const getAvatarByUserId = (userId: string, userName: string): string | null => {
    const profile = profileMap.get(userId);
    if (profile?.avatar_url) return profile.avatar_url;
    return employeeAvatarMap.get(userName) || null;
  };

  const getDisplayNameByUserId = (userId: string, userName: string): string => {
    const profile = profileMap.get(userId);
    return profile?.display_name || userName;
  };

  const getPositionByUserId = (userId: string, userName: string): string | null => {
    const profile = profileMap.get(userId);
    return profile?.position || null;
  };

  const isCeoUser = (userId: string): boolean => ceoSet.has(userId);

  return { getAvatarByUserId, getDisplayNameByUserId, getPositionByUserId, isCeoUser };
}

export default function ChatRooms() {
  const { rooms, loading: roomsLoading, createRoom, deleteRoom } = useChatRooms();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const { messages, loading: msgsLoading, sendMessage, editMessage, deleteMessage, togglePin, addReaction } = useChatMessages(selectedRoom?.id || null);
  const { getAvatarByUserId, getDisplayNameByUserId, getPositionByUserId, isCeoUser } = useUserAvatarMap();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('general');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [wallpaperDialogOpen, setWallpaperDialogOpen] = useState(false);
  const wallpaperFileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isCEO, profile, role } = useAuthContext();
  const { data: prefs } = useUserPreferences();
  const updatePrefs = useUpdatePreferences();
  const uploadThemeImage = useUploadThemeImage();
  const { toast } = useToast();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!selectedRoom && rooms.length > 0) setSelectedRoom(rooms[0]);
  }, [rooms, selectedRoom]);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
    utterance.lang = 'ar-SA';
    utterance.rate = 1;
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arVoice) utterance.voice = arVoice;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    // Detect AI triggers: ai, AI, Ai, @BatShark, @AI, ساعدني, يا AI, يا ذكاء
    const aiTriggerPatterns = [/\bai\b/i, /@BatShark/i, /@AI/i, /ساعدني\s*(يا)?\s*(AI|ذكاء)/i, /يا\s*(AI|ذكاء)/i];
    const hasBatShark = aiTriggerPatterns.some(p => p.test(input));
    const question = hasBatShark ? input.replace(/\bai\b\s*/gi, '').replace(/@[Bb]at[Ss]hark\s*/gi, '').replace(/@AI\s*/gi, '').replace(/ساعدني\s*(يا)?\s*(AI|ذكاء)?\s*/gi, '').replace(/يا\s*(AI|ذكاء)\s*/gi, '').trim() : '';
    
    await sendMessage(input, replyTo?.id);
    setInput('');
    setReplyTo(null);

    if (hasBatShark) {
      const aiQuestion = question || 'أعطني ملخص سريع عن وضع الشركة الحالي';
      setAiLoading(true);
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batshark-ai`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: aiQuestion }],
            userName: profile?.display_name || 'المستخدم',
          }),
        });
        if (resp.ok && resp.body) {
          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let aiResponse = '';
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let idx: number;
            while ((idx = buf.indexOf('\n')) !== -1) {
              let line = buf.slice(0, idx);
              buf = buf.slice(idx + 1);
              if (line.endsWith('\r')) line = line.slice(0, -1);
              if (!line.startsWith('data: ')) continue;
              const json = line.slice(6).trim();
              if (json === '[DONE]') break;
              try {
                const c = JSON.parse(json).choices?.[0]?.delta?.content;
                if (c) aiResponse += c;
              } catch {}
            }
          }
          if (aiResponse) {
            await sendMessage(`🧠 **BatShark AI:**\n\n${aiResponse}`, undefined, undefined, undefined, 'ai');
          }
        }
      } catch { /* silent */ }
      setAiLoading(false);
    }
  }, [input, replyTo, sendMessage, profile]);

  const handleEdit = useCallback(async () => {
    if (!editingMsg || !editText.trim()) return;
    await editMessage(editingMsg.id, editText);
    setEditingMsg(null);
    setEditText('');
  }, [editingMsg, editText, editMessage]);

  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim()) return;
    await createRoom(newRoomName, newRoomType, newRoomDesc);
    setNewRoomName('');
    setNewRoomType('general');
    setNewRoomDesc('');
    setNewRoomOpen(false);
  }, [newRoomName, newRoomType, newRoomDesc, createRoom]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom) return;
    const ext = file.name.split('.').pop();
    const path = `chat/${selectedRoom.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('documents').upload(path, file);
    if (error) {
      toast({ title: 'خطأ في رفع الملف', variant: 'destructive' });
      return;
    }
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
    const isImage = file.type.startsWith('image/');
    await sendMessage(isImage ? '📷 صورة' : `📎 ${file.name}`, undefined, urlData.publicUrl, file.name, isImage ? 'image' : 'file');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedRoom, sendMessage, toast]);

  const filteredMessages = search
    ? messages.filter(m => m.content.includes(search) || m.user_name.includes(search))
    : messages;

  const pinnedMessages = messages.filter(m => m.is_pinned);
  const isCurrentUserAdmin = isCEO || role === 'ceo' || role === 'coo';

  // Get display name for sender using user_id lookup
  const getDisplayName = (userName: string, userId?: string) => {
    if (userId) {
      const fullName = getDisplayNameByUserId(userId, userName);
      const isCeo = isCeoUser(userId);
      if (isCeo) return `👑 ${fullName}`;
      if (fullName && fullName !== userName) return fullName;
    }
    return userName;
  };

  // Get avatar for a user by user_id
  const getUserAvatar = (userId: string, userName: string): string | null => {
    return getAvatarByUserId(userId, userName);
  };

  // Get position for a user by user_id
  const getUserPosition = (userId: string, userName: string): string | null => {
    return getPositionByUserId(userId, userName);
  };

  // Handle chat wallpaper upload
  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadThemeImage.mutateAsync({ file, type: 'wallpaper' });
      await updatePrefs.mutateAsync({ chat_wallpaper_url: url });
      toast({ title: '✅ تم حفظ خلفية الغرفة' });
    } catch {
      toast({ title: 'خطأ', variant: 'destructive' });
    }
  };

  const chatWallpaper = prefs?.chat_wallpaper_url;
  const chatOpacity = prefs?.chat_wallpaper_opacity ?? 0.3;
  const chatBlur = prefs?.chat_wallpaper_blur ?? 8;

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:fixed md:inset-0" style={{ background: 'linear-gradient(135deg, hsl(220 20% 11%), hsl(220 22% 8%))' }}>
      {/* Top bar */}
      <div className="h-12 flex items-center justify-between px-3 md:px-4 border-b border-[hsl(220,18%,18%)] shrink-0" style={{ background: 'linear-gradient(90deg, hsl(220 20% 13%), hsl(220 20% 10%))' }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="h-8 w-8 rounded-lg bg-[hsl(210,80%,52%/0.1)] hover:bg-[hsl(210,80%,52%/0.2)] flex items-center justify-center text-[hsl(210,80%,58%)] transition-colors">
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[hsl(190,80%,50%)]" />
            <h1 className="text-sm font-heading font-bold text-white">BatShark Hub</h1>
            <span className="text-[9px] text-[hsl(220,10%,45%)] tracking-wider uppercase hidden sm:inline">Economy Intelligence Network</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile && (
            <div className="flex items-center gap-2">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/10" style={{ filter: 'none' }} />
              ) : (
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getAvatarColor(profile.display_name || 'U')} flex items-center justify-center text-white`}>
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="text-[11px] text-[hsl(210,20%,80%)] hidden sm:inline">{isCurrentUserAdmin ? '👑 عبدالرحمن CEO' : profile.display_name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(152,60%,45%)]" />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Rooms Sidebar - hidden on mobile when a room is selected */}
        <div className={`${selectedRoom ? 'hidden md:flex' : 'flex'} w-full md:w-72 border-l border-[hsl(215,25%,22%)] flex-col shrink-0`} style={{ background: 'hsl(215 22% 14%)' }}>
          <div className="p-3 border-b border-[hsl(215,25%,22%)] flex items-center justify-between" style={{ background: 'hsl(215 22% 16%)' }}>
            <h3 className="font-heading font-bold text-sm text-white">💬 الغرف</h3>
            <Dialog open={newRoomOpen} onOpenChange={setNewRoomOpen}>
              <DialogTrigger asChild>
                <button className="h-7 w-7 rounded-lg bg-[hsl(210,80%,52%/0.15)] hover:bg-[hsl(210,80%,52%/0.25)] flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4 text-[hsl(210,80%,58%)]" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">إنشاء غرفة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <Input placeholder="اسم الغرفة" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
                  <Select value={newRoomType} onValueChange={setNewRoomType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">🌐 عامة</SelectItem>
                      <SelectItem value="private">🔒 خاصة</SelectItem>
                      <SelectItem value="project">📁 مشروع</SelectItem>
                      <SelectItem value="admin">🛡️ إدارية</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="وصف الغرفة (اختياري)" value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)} />
                  <Button onClick={handleCreateRoom} className="w-full">إنشاء الغرفة</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {roomsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-[hsl(210,80%,52%/0.3)] border-t-[hsl(210,80%,52%)] rounded-full animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-[hsl(215,20%,40%)] mx-auto mb-2" />
                <p className="text-xs text-[hsl(215,15%,55%)]">أنشئ أول غرفة نقاش</p>
              </div>
            ) : (
              rooms.map(room => {
                const isActive = selectedRoom?.id === room.id;
                return (
                  <motion.button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    whileHover={{ x: -2 }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-right transition-all ${
                      isActive
                        ? 'bg-[hsl(210,70%,22%)] border border-[hsl(210,80%,45%/0.35)] shadow-md'
                        : 'hover:bg-[hsl(215,22%,18%)] border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-[hsl(210,70%,30%)]' : 'bg-[hsl(215,22%,20%)]'}`}>
                      <span className={ROOM_COLORS[room.type] || 'text-[hsl(220,10%,50%)]'}>
                        {ROOM_ICONS[room.type] || <Hash className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-white font-bold' : 'text-[hsl(210,20%,85%)]'}`}>{room.name}</p>
                      {room.description && (
                        <p className="text-[10px] text-[hsl(215,15%,55%)] truncate">{room.description}</p>
                      )}
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>

          {/* User presence */}
          <div className="p-3 border-t border-[hsl(215,25%,22%)]" style={{ background: 'hsl(215 22% 16%)' }}>
            <div className="flex items-center gap-2">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover ring-2 ring-[hsl(210,70%,40%/0.4)]" style={{ filter: 'none' }} />
              ) : (
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getAvatarColor(profile?.display_name || 'U')} flex items-center justify-center text-white`}>
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{isCurrentUserAdmin ? '👑 عبدالرحمن CEO' : profile?.display_name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[hsl(152,60%,45%)]">● متصل</span>
                  {isCurrentUserAdmin && <span className="text-[9px] bg-[hsl(25,85%,52%/0.2)] text-[hsl(25,85%,58%)] px-1.5 rounded">إدارة</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area - hidden on mobile when no room selected */}
        <div className={`${!selectedRoom ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0`}>
          {selectedRoom ? (
            <>
              {/* Header */}
              <div className="px-3 md:px-4 py-2.5 border-b border-[hsl(220,18%,22%)] flex items-center justify-between" style={{ background: 'linear-gradient(90deg, hsl(220 20% 15%), hsl(220 20% 13%))' }}>
                <div className="flex items-center gap-2.5">
                  {/* Back button on mobile */}
                  <button onClick={() => setSelectedRoom(null)} className="md:hidden h-8 w-8 rounded-lg bg-[hsl(210,80%,52%/0.1)] hover:bg-[hsl(210,80%,52%/0.2)] flex items-center justify-center text-[hsl(210,80%,58%)] transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${ROOM_BG[selectedRoom.type] || ROOM_BG.general}`}>
                    <span className={ROOM_COLORS[selectedRoom.type]}>
                      {ROOM_ICONS[selectedRoom.type]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-white">{selectedRoom.name}</h3>
                    {selectedRoom.description && (
                      <p className="text-[10px] text-[hsl(220,10%,50%)]">{selectedRoom.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {aiLoading && (
                    <span className="text-[10px] text-[hsl(190,80%,50%)] animate-pulse flex items-center gap-1">
                      <Brain className="w-3 h-3" /> BatShark يفكر...
                    </span>
                  )}
                  {pinnedMessages.length > 0 && (
                    <button
                      onClick={() => setShowPinned(!showPinned)}
                      className={`h-7 px-2 rounded-lg text-[10px] flex items-center gap-1 transition-colors ${showPinned ? 'bg-[hsl(43,65%,50%/0.2)] text-[hsl(43,65%,55%)]' : 'text-[hsl(220,10%,50%)] hover:bg-[hsl(220,18%,20%)]'}`}
                    >
                      <Pin className="w-3 h-3" /> {pinnedMessages.length}
                    </button>
                  )}
                  <button
                    onClick={() => setSearchOpen(!searchOpen)}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${searchOpen ? 'bg-[hsl(210,80%,52%/0.2)] text-[hsl(210,80%,58%)]' : 'text-[hsl(220,10%,50%)] hover:bg-[hsl(220,18%,20%)]'}`}
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                  {/* Wallpaper button */}
                  <button
                    onClick={() => wallpaperFileRef.current?.click()}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-[hsl(220,10%,50%)] hover:bg-[hsl(220,18%,20%)] transition-colors"
                    title="جدار الغرفة"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                  <input ref={wallpaperFileRef} type="file" accept="image/*" className="hidden" onChange={handleWallpaperUpload} />
                  {(isCEO || selectedRoom.created_by === user?.id) && (
                    <button
                      onClick={() => { deleteRoom(selectedRoom.id); setSelectedRoom(null); }}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-[hsl(0,72%,55%/0.6)] hover:bg-[hsl(0,72%,55%/0.1)] hover:text-[hsl(0,72%,55%)] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search bar */}
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-2 bg-[hsl(220,20%,12%)] border-b border-[hsl(220,18%,22%)]"
                  >
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(220,10%,45%)]" />
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="ابحث في الرسائل..."
                        autoFocus
                        className="w-full text-xs bg-[hsl(220,18%,18%)] border border-[hsl(220,18%,25%)] rounded-lg pr-8 pl-3 py-2 text-[hsl(210,20%,90%)] placeholder:text-[hsl(220,10%,40%)] focus:outline-none focus:ring-1 focus:ring-[hsl(210,80%,52%/0.5)]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pinned messages */}
              <AnimatePresence>
                {showPinned && pinnedMessages.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-2 bg-[hsl(43,65%,50%/0.05)] border-b border-[hsl(43,65%,50%/0.15)]"
                  >
                    <p className="text-[10px] font-heading font-bold text-[hsl(43,65%,55%)] mb-1.5 flex items-center gap-1"><Pin className="w-3 h-3" /> رسائل مثبتة</p>
                    {pinnedMessages.map(m => (
                      <p key={m.id} className="text-xs text-[hsl(210,20%,80%)] truncate mb-0.5">
                        <strong className="text-[hsl(43,65%,55%)]">{getDisplayName(m.user_name, m.user_id)}:</strong> {m.content.slice(0, 80)}
                      </p>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 relative" style={{ background: 'hsl(220 20% 13%)' }}>
                {/* Chat Wallpaper — solid, no blur/glass */}
                {chatWallpaper && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                    <img src={chatWallpaper} alt="" className="w-full h-full object-cover" style={{ opacity: chatOpacity }} />
                    <div className="absolute inset-0" style={{ background: prefs?.chat_wallpaper_overlay || 'rgba(0,0,0,0.4)' }} />
                  </div>
                )}
                {msgsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-[hsl(210,80%,52%/0.3)] border-t-[hsl(210,80%,52%)] rounded-full animate-spin" />
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 rounded-2xl bg-[hsl(220,18%,18%)] flex items-center justify-center mb-3">
                      <MessageSquare className="w-7 h-7 text-[hsl(220,15%,30%)]" />
                    </div>
                    <p className="text-sm text-[hsl(220,10%,45%)]">ابدأ المحادثة الآن</p>
                    <p className="text-[10px] text-[hsl(220,10%,35%)] mt-1">اكتب @BatShark لاستدعاء الذكاء الاصطناعي</p>
                  </div>
                ) : (
                  filteredMessages.map((msg, idx) => {
                    const isOwn = msg.user_id === user?.id;
                    const isAI = msg.message_type === 'ai';
                    const isAdmin = isCeoUser(msg.user_id);
                    const replyMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                    const showAvatar = idx === 0 || filteredMessages[idx - 1]?.user_id !== msg.user_id;
                    const avatarColor = getAvatarColor(msg.user_name);
                    const reactions = msg.reactions || {};
                    const userAvatarUrl = getUserAvatar(msg.user_id, msg.user_name);
                    const displayName = getDisplayName(msg.user_name, msg.user_id);

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex gap-2 group ${isOwn ? 'flex-row' : 'flex-row-reverse'}`}
                      >
                        {/* Avatar */}
                        <div className="w-8 shrink-0">
                          {showAvatar && (
                            isAI ? (
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)] flex items-center justify-center text-white">
                                <Brain className="w-4 h-4" />
                              </div>
                            ) : userAvatarUrl ? (
                              <img src={userAvatarUrl} alt={displayName} className={`w-8 h-8 rounded-lg object-cover ring-1 ring-white/10 ${isAdmin ? 'ring-2 ring-[hsl(43,65%,50%/0.5)]' : ''}`} style={{ imageRendering: 'auto', filter: 'none' }} />
                            ) : (
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarColor} flex items-center justify-center ${isAdmin ? 'ring-2 ring-[hsl(43,65%,50%/0.5)]' : ''}`}>
                                <UsersIcon className="w-4 h-4 text-white/80" />
                              </div>
                            )
                          )}
                        </div>

                        {/* Message */}
                        <div className={`max-w-[70%] min-w-[120px]`}>
                          {replyMsg && (
                            <div className="text-[10px] bg-[hsl(210,80%,52%/0.08)] rounded-t-lg px-3 py-1 border-r-2 border-[hsl(210,80%,52%/0.4)] text-[hsl(220,10%,55%)] mb-0.5">
                              <span className="font-bold text-[hsl(210,80%,58%)]">{getDisplayName(replyMsg.user_name, replyMsg.user_id)}</span>: {replyMsg.content.slice(0, 50)}
                            </div>
                          )}

                          <div className={`rounded-2xl px-3.5 py-2.5 relative shadow-md ${
                            isAI
                              ? 'bg-[hsl(190,60%,15%)] border border-[hsl(190,80%,30%/0.4)]'
                              : isAdmin && !isOwn
                                ? 'bg-[hsl(35,40%,16%)] border border-[hsl(43,65%,40%/0.3)] rounded-bl-md'
                                : isOwn
                                  ? 'bg-[hsl(210,60%,22%)] rounded-br-md'
                                  : 'bg-[hsl(220,20%,18%)] border border-[hsl(220,18%,24%)] rounded-bl-md'
                          } ${msg.is_pinned ? 'ring-1 ring-[hsl(43,65%,50%/0.3)]' : ''}`}>
                            {showAvatar && (
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[11px] font-heading font-bold ${
                                  isAI ? 'text-[hsl(190,80%,50%)]' : isAdmin ? 'text-[hsl(43,65%,55%)]' : 'text-[hsl(210,80%,65%)]'
                                }`}>
                                  {isAI ? '🧠 BatShark AI' : displayName}
                                </span>
                                {!isAI && getUserPosition(msg.user_id, msg.user_name) && (
                                  <span className="text-[9px] text-[hsl(220,10%,50%)]">{getUserPosition(msg.user_id, msg.user_name)}</span>
                                )}
                                {isAdmin && !isAI && (
                                  <span className="text-[8px] bg-[hsl(43,65%,50%/0.2)] text-[hsl(43,65%,55%)] px-1 rounded">👑 CEO</span>
                                )}
                                <span className="text-[9px] text-[hsl(220,10%,40%)]">
                                  {format(new Date(msg.created_at), 'hh:mm a', { locale: ar })}
                                </span>
                                {msg.is_edited && <span className="text-[9px] text-[hsl(220,10%,35%)]">(معدّل)</span>}
                                {msg.is_pinned && <Pin className="w-2.5 h-2.5 text-[hsl(43,65%,55%)]" />}
                              </div>
                            )}

                            {msg.message_type === 'image' && msg.file_url ? (
                              <div>
                                <img src={msg.file_url} alt="صورة" className="rounded-lg max-w-full max-h-64 object-contain mb-1" loading="lazy" style={{ imageRendering: 'auto', filter: 'none' }} />
                              </div>
                            ) : msg.message_type === 'file' && msg.file_url ? (
                              <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[hsl(220,18%,18%)] rounded-lg p-2 hover:bg-[hsl(220,18%,22%)] transition-colors">
                                <Paperclip className="w-4 h-4 text-[hsl(210,80%,58%)]" />
                                <span className="text-xs text-[hsl(210,20%,80%)]">{msg.file_name || 'ملف مرفق'}</span>
                              </a>
                            ) : isAI ? (
                              <div className="prose prose-sm prose-invert max-w-none text-[13px] [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:text-[hsl(210,20%,88%)] [&_strong]:text-[hsl(190,80%,55%)] [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h3]:text-sm">
                                <ReactMarkdown>{msg.content.replace(/^🧠 \*\*BatShark AI:\*\*\n\n/, '')}</ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-[13px] text-[hsl(210,20%,88%)] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}

                            {isAI && (
                              <button
                                onClick={() => speakText(msg.content)}
                                className="mt-1 flex items-center gap-1 text-[10px] text-[hsl(190,80%,45%)] hover:text-[hsl(190,80%,55%)] transition-colors"
                              >
                                <Volume2 className="w-3 h-3" /> استمع
                              </button>
                            )}

                            {Object.keys(reactions).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {Object.entries(reactions).map(([emoji, users]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => addReaction(msg.id, emoji)}
                                    className={`text-[11px] px-1.5 py-0.5 rounded-md border transition-colors ${
                                      (users as string[]).includes(user?.id || '')
                                        ? 'bg-[hsl(210,80%,52%/0.15)] border-[hsl(210,80%,52%/0.3)] text-[hsl(210,20%,85%)]'
                                        : 'bg-[hsl(220,18%,18%)] border-[hsl(220,18%,25%)] text-[hsl(220,10%,50%)]'
                                    }`}
                                  >
                                    {emoji} {(users as string[]).length}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setReplyTo(msg)} className="text-[10px] text-[hsl(220,10%,45%)] hover:text-[hsl(210,80%,58%)] p-1 rounded transition-colors">
                              <Reply className="w-3 h-3" />
                            </button>
                            <button onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)} className="text-[10px] text-[hsl(220,10%,45%)] hover:text-[hsl(43,65%,55%)] p-1 rounded transition-colors">
                              <SmilePlus className="w-3 h-3" />
                            </button>
                            <button onClick={() => togglePin(msg.id, msg.is_pinned)} className="text-[10px] text-[hsl(220,10%,45%)] hover:text-[hsl(43,65%,55%)] p-1 rounded transition-colors">
                              {msg.is_pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                            </button>
                            {isOwn && (
                              <>
                                <button onClick={() => { setEditingMsg(msg); setEditText(msg.content); }} className="text-[10px] text-[hsl(220,10%,45%)] hover:text-[hsl(210,80%,58%)] p-1 rounded transition-colors">
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button onClick={() => deleteMessage(msg.id)} className="text-[10px] text-[hsl(220,10%,45%)] hover:text-[hsl(0,72%,55%)] p-1 rounded transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>

                          <AnimatePresence>
                            {showReactions === msg.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex gap-1 bg-[hsl(220,18%,18%)] border border-[hsl(220,18%,25%)] rounded-xl p-1.5 mt-1 w-fit"
                              >
                                {QUICK_REACTIONS.map(r => (
                                  <button
                                    key={r}
                                    onClick={() => { addReaction(msg.id, r); setShowReactions(null); }}
                                    className="w-7 h-7 rounded-lg hover:bg-[hsl(220,18%,25%)] flex items-center justify-center text-sm transition-colors"
                                  >
                                    {r}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Edit bar */}
              <AnimatePresence>
                {editingMsg && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-2 bg-[hsl(210,80%,52%/0.08)] border-t border-[hsl(210,80%,52%/0.2)] flex items-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[hsl(210,80%,58%)]" />
                    <input
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleEdit()}
                      autoFocus
                      className="flex-1 text-xs bg-transparent text-[hsl(210,20%,90%)] focus:outline-none"
                    />
                    <button onClick={handleEdit} className="text-[hsl(152,60%,45%)]"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingMsg(null)} className="text-[hsl(0,72%,55%/0.6)]"><X className="w-4 h-4" /></button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reply indicator */}
              <AnimatePresence>
                {replyTo && !editingMsg && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-2 bg-[hsl(220,18%,15%)] border-t border-[hsl(220,18%,22%)] flex items-center gap-2"
                  >
                    <Reply className="w-3.5 h-3.5 text-[hsl(210,80%,58%)]" />
                    <span className="text-xs text-[hsl(220,10%,55%)] flex-1 truncate">
                      رد على <strong className="text-[hsl(210,80%,65%)]">{getDisplayName(replyTo.user_name, replyTo.user_id)}</strong>: {replyTo.content.slice(0, 40)}
                    </span>
                    <button onClick={() => setReplyTo(null)}>
                      <X className="w-3.5 h-3.5 text-[hsl(220,10%,45%)] hover:text-[hsl(0,72%,55%)]" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <div className="px-4 py-1.5 flex items-center gap-2">
                  {(() => {
                    const typingAvatar = user ? getUserAvatar(user.id, profile?.display_name || '') : null;
                    return typingAvatar ? (
                      <img src={typingAvatar} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10" style={{ filter: 'none' }} />
                    ) : profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10" style={{ filter: 'none' }} />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[hsl(210,80%,45%)] to-[hsl(210,80%,52%)] flex items-center justify-center">
                        <UsersIcon className="w-3 h-3 text-white/80" />
                      </div>
                    );
                  })()}
                  <span className="text-[10px] text-[hsl(220,10%,50%)]">
                    <strong className="text-[hsl(210,80%,65%)]">{profile?.display_name || 'مستخدم'}</strong> يكتب الآن...
                  </span>
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-[hsl(220,18%,22%)] flex items-center gap-2" style={{ background: 'hsl(220 20% 12%)' }}>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9 rounded-xl bg-[hsl(220,18%,18%)] hover:bg-[hsl(220,18%,22%)] flex items-center justify-center text-[hsl(220,10%,50%)] hover:text-[hsl(210,80%,58%)] transition-colors shrink-0"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  value={input}
                  onChange={e => { setInput(e.target.value); setIsTyping(e.target.value.length > 0); }}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="اكتب رسالة... (اكتب @BatShark لاستدعاء AI)"
                  className="flex-1 bg-[hsl(220,18%,18%)] border border-[hsl(220,18%,25%)] rounded-xl px-4 py-2.5 text-sm text-[hsl(210,20%,90%)] placeholder:text-[hsl(220,10%,35%)] focus:outline-none focus:ring-1 focus:ring-[hsl(210,80%,52%/0.5)] focus:border-[hsl(210,80%,52%/0.3)]"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || aiLoading}
                  className="h-9 w-9 rounded-xl bg-gradient-to-br from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)] hover:from-[hsl(190,80%,50%)] hover:to-[hsl(210,80%,57%)] flex items-center justify-center text-white transition-all disabled:opacity-30 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{ background: 'hsl(220 20% 13%)' }}>
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-[hsl(220,18%,16%)] flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-9 h-9 text-[hsl(220,15%,25%)]" />
                </div>
                <h3 className="text-sm font-heading font-bold text-[hsl(210,20%,70%)] mb-1">BatShark Communication Hub</h3>
                <p className="text-[10px] text-[hsl(220,10%,40%)]">اختر غرفة للبدء أو أنشئ غرفة جديدة</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
