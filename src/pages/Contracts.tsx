import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  FileText, Plus, Printer, Send, UploadCloud, KeyRound, Trash2,
  CheckCircle2, PenLine, Building2, Handshake, Megaphone, UserPlus, Copy,
} from 'lucide-react';
import logo from '@/assets/batshark-logo-new.png';

type Clause = { title: string; body: string };
type Template = {
  id: string; type: string; name: string; description: string | null;
  default_clauses: Clause[]; required_documents: string[]; required_fields: string[];
};
type Contract = {
  id: string; contract_number: string; type: string; title: string; status: string;
  party_name: string; party_email: string | null; party_phone: string | null;
  party_national_id: string | null; party_address: string | null;
  company_name: string | null; commercial_registration: string | null; tax_number: string | null;
  contract_value: number | null; currency: string;
  equity_percentage: number | null; monthly_salary: number | null; monthly_bonus: number | null;
  start_date: string | null; end_date: string | null;
  clauses: Clause[]; custom_clauses: Clause[];
  required_documents: string[]; requested_info: string[]; submitted_info: Record<string, string>;
  ceo_signature_data: string | null; party_signature_data: string | null;
  ceo_signed_at: string | null; party_signed_at: string | null;
  documents_submitted_at: string | null;
  generated_user_id: string | null; credentials_sent_at: string | null;
  notes: string | null; created_at: string;
};

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  partnership: { label: 'شراكة تجارية', icon: Handshake, color: 'text-emerald-500' },
  service:     { label: 'تعاقد خدمة/مورّد', icon: Building2, color: 'text-blue-500' },
  sponsorship: { label: 'رعاية / إعلان', icon: Megaphone, color: 'text-orange-500' },
  employment:  { label: 'عقد عمل موظف', icon: UserPlus, color: 'text-purple-500' },
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:               { label: 'مسودّة',              cls: 'bg-muted text-muted-foreground' },
  sent:                { label: 'مُرسل',              cls: 'bg-blue-500/15 text-blue-500' },
  awaiting_documents:  { label: 'بانتظار المستندات',  cls: 'bg-amber-500/15 text-amber-500' },
  awaiting_signature:  { label: 'بانتظار التوقيع',    cls: 'bg-orange-500/15 text-orange-500' },
  signed:              { label: 'تم التوقيع',         cls: 'bg-emerald-500/15 text-emerald-500' },
  active:              { label: '✅ مفعّل',            cls: 'bg-emerald-600/20 text-emerald-500' },
  expired:             { label: 'منتهي',              cls: 'bg-muted text-muted-foreground' },
  terminated:          { label: 'مُنهى',              cls: 'bg-destructive/15 text-destructive' },
  cancelled:           { label: 'ملغى',               cls: 'bg-destructive/15 text-destructive' },
};

function nextContractNumber() {
  const y = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BSK-${y}-${rand}`;
}

export default function Contracts() {
  const { isCEO, profile, user } = useAuthContext();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [detail, setDetail] = useState<Contract | null>(null);

  const load = async () => {
    setLoading(true);
    const [t, c] = await Promise.all([
      supabase.from('contract_templates').select('*').order('type'),
      supabase.from('contracts').select('*').order('created_at', { ascending: false }),
    ]);
    setTemplates((t.data as any) || []);
    setContracts((c.data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const activeCount = contracts.filter(c => c.status === 'active' || c.status === 'signed').length;
  const draftCount = contracts.filter(c => c.status === 'draft').length;
  const pendingCount = contracts.filter(c => ['sent','awaiting_documents','awaiting_signature'].includes(c.status)).length;
  const totalValue = contracts.reduce((s, c) => s + (Number(c.contract_value) || 0), 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Executive Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(222,47%,14%)] to-[hsl(43,60%,18%)] p-6 md:p-8 shadow-2xl">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <FileText className="w-7 h-7 text-[hsl(222,47%,11%)]" />
              </div>
              <div>
                <div className="text-[11px] tracking-[0.35em] text-amber-300/80 font-bold">BATSHARK · LEGAL SUITE</div>
                <h1 className="text-2xl md:text-3xl font-black text-white mt-0.5">مركز العقود والشراكات</h1>
                <p className="text-sm text-white/60 mt-1 max-w-xl">
                  إصدار وتوقيع رقمي، أرشفة رسمية، وتفعيل حسابات الأطراف تلقائياً — بمعايير مؤسسية.
                </p>
              </div>
            </div>
            {isCEO && (
              <Button onClick={() => setOpenNew(true)} size="lg"
                className="gap-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-[hsl(222,47%,11%)] font-bold shadow-lg shadow-amber-500/20 rounded-xl h-12 px-6">
                <Plus className="w-5 h-5" /> إصدار عقد جديد
              </Button>
            )}
          </div>

          {/* KPI strip */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'إجمالي العقود', value: contracts.length, tint: 'from-blue-500/20 to-blue-500/5', ring: 'ring-blue-400/30', text: 'text-blue-200' },
              { label: 'نشطة / موقّعة', value: activeCount, tint: 'from-emerald-500/20 to-emerald-500/5', ring: 'ring-emerald-400/30', text: 'text-emerald-200' },
              { label: 'قيد المعالجة', value: pendingCount, tint: 'from-amber-500/20 to-amber-500/5', ring: 'ring-amber-400/30', text: 'text-amber-200' },
              { label: 'إجمالي القيمة', value: `${totalValue.toLocaleString('ar')} ر.س`, tint: 'from-purple-500/20 to-purple-500/5', ring: 'ring-purple-400/30', text: 'text-purple-200', small: true },
            ].map((k, i) => (
              <div key={i} className={`rounded-2xl p-4 bg-gradient-to-br ${k.tint} ring-1 ${k.ring} backdrop-blur-sm`}>
                <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{k.label}</div>
                <div className={`mt-1 font-black text-white ${k.small ? 'text-lg' : 'text-2xl'}`}>{k.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Type breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(TYPE_META).map(([k, m]) => {
            const count = contracts.filter(c => c.type === k).length;
            const Icon = m.icon;
            return (
              <motion.div key={k} whileHover={{ y: -3, scale: 1.01 }}
                className="relative overflow-hidden rounded-2xl border bg-card p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center ${m.color} ring-1 ring-border`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-muted-foreground font-medium">{m.label}</div>
                  <div className="text-2xl font-black text-foreground leading-tight">{count}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* List */}
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-l from-muted/50 to-transparent flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              سجل العقود <span className="text-muted-foreground font-normal">({contracts.length})</span>
            </h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : contracts.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-3">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">لا توجد عقود بعد. {isCEO && 'ابدأ بإصدار عقد جديد.'}</p>
            </div>
          ) : (
            <div className="divide-y">
              {contracts.map(c => {
                const meta = TYPE_META[c.type];
                const st = STATUS_META[c.status] || STATUS_META.draft;
                const Icon = meta?.icon || FileText;
                return (
                  <button key={c.id} onClick={() => setDetail(c)}
                    className="w-full text-right p-4 hover:bg-muted/40 transition flex items-center gap-4 group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center ${meta?.color} ring-1 ring-border group-hover:scale-105 transition`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold truncate">{c.title}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{c.contract_number}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span>👤 {c.party_name}</span>
                        {c.company_name && <span>🏢 {c.company_name}</span>}
                        {c.contract_value && <span className="font-semibold text-foreground">💰 {Number(c.contract_value).toLocaleString('ar')} {c.currency}</span>}
                      </div>
                    </div>
                    <Badge className={`${st.cls} font-bold`}>{st.label}</Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {openNew && (
        <NewContractDialog
          templates={templates}
          onClose={() => setOpenNew(false)}
          onCreated={async () => { setOpenNew(false); await load(); }}
          userId={user?.id || null}
        />
      )}
      {detail && (
        <ContractDetailDialog
          contract={detail}
          isCEO={isCEO}
          myId={user?.id || null}
          myName={profile?.display_name || 'مستخدم'}
          onClose={() => setDetail(null)}
          onChange={async () => {
            await load();
            const { data } = await supabase.from('contracts').select('*').eq('id', detail.id).single();
            if (data) setDetail(data as any);
          }}
        />
      )}
    </Layout>
  );
}

/* ================= New Contract Dialog ================= */
function NewContractDialog({
  templates, onClose, onCreated, userId,
}: {
  templates: Template[]; onClose: () => void; onCreated: () => void; userId: string | null;
}) {
  const [type, setType] = useState<string>('partnership');
  const template = useMemo(() => templates.find(t => t.type === type), [templates, type]);

  const [form, setForm] = useState({
    title: '',
    party_name: '', party_email: '', party_phone: '', party_national_id: '', party_address: '',
    company_name: '', commercial_registration: '', tax_number: '',
    contract_value: '', currency: 'SAR',
    equity_percentage: '', monthly_salary: '', monthly_bonus: '',
    start_date: '', end_date: '',
    notes: '',
  });
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [customClauses, setCustomClauses] = useState<Clause[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setClauses(template.default_clauses || []);
      setForm(f => ({ ...f, title: f.title || template.name }));
    }
  }, [template]);

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const addCustom = () => setCustomClauses(cs => [...cs, { title: 'بند إضافي', body: '' }]);
  const updClause = (i: number, k: 'title' | 'body', v: string) =>
    setClauses(cs => cs.map((c, idx) => idx === i ? { ...c, [k]: v } : c));
  const updCustom = (i: number, k: 'title' | 'body', v: string) =>
    setCustomClauses(cs => cs.map((c, idx) => idx === i ? { ...c, [k]: v } : c));
  const rmCustom = (i: number) => setCustomClauses(cs => cs.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!form.title.trim() || !form.party_name.trim()) {
      toast.error('العنوان واسم الطرف الآخر مطلوبان');
      return;
    }
    setSaving(true);
    const payload: any = {
      contract_number: nextContractNumber(),
      type, title: form.title, status: 'draft',
      party_name: form.party_name,
      party_email: form.party_email || null,
      party_phone: form.party_phone || null,
      party_national_id: form.party_national_id || null,
      party_address: form.party_address || null,
      company_name: form.company_name || null,
      commercial_registration: form.commercial_registration || null,
      tax_number: form.tax_number || null,
      currency: form.currency,
      contract_value: form.contract_value ? Number(form.contract_value) : null,
      equity_percentage: form.equity_percentage ? Number(form.equity_percentage) : null,
      monthly_salary: form.monthly_salary ? Number(form.monthly_salary) : null,
      monthly_bonus: form.monthly_bonus ? Number(form.monthly_bonus) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      clauses, custom_clauses: customClauses,
      required_documents: template?.required_documents || [],
      requested_info: template?.required_fields || [],
      notes: form.notes || null,
      created_by: userId,
    };
    const { data, error } = await supabase.from('contracts').insert(payload).select().single();
    setSaving(false);
    if (error) { toast.error('فشل الإنشاء: ' + error.message); return; }
    await supabase.from('contract_activity').insert({
      contract_id: data.id, action: 'created', actor_id: userId, actor_name: 'الرئيس التنفيذي',
    });
    toast.success('تم إنشاء العقد بنجاح');
    onCreated();
  };

  const showEquity = type === 'partnership';
  const showSalary = type === 'employment';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> عقد جديد
          </DialogTitle>
          <DialogDescription>
            اختر نوع التعاقد، عبّئ بيانات الطرف الآخر، وعدّل البنود قبل الإصدار الرسمي.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Type */}
          <div>
            <label className="text-sm font-medium">نوع التعاقد</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_META).map(([k, m]) => (
                  <SelectItem key={k} value={k}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">عنوان العقد</label>
            <Input value={form.title} onChange={e => upd('title', e.target.value)}
              placeholder="مثال: شراكة مشروع الملاعب" className="mt-1" />
          </div>

          {/* Party */}
          <Section title="👤 بيانات الطرف الآخر">
            <Grid>
              <Field label="الاسم الكامل *"><Input value={form.party_name} onChange={e => upd('party_name', e.target.value)} /></Field>
              <Field label="البريد الإلكتروني (لإنشاء الحساب)"><Input type="email" value={form.party_email} onChange={e => upd('party_email', e.target.value)} /></Field>
              <Field label="رقم الجوال"><Input value={form.party_phone} onChange={e => upd('party_phone', e.target.value)} /></Field>
              <Field label="رقم الهوية / الإقامة"><Input value={form.party_national_id} onChange={e => upd('party_national_id', e.target.value)} /></Field>
              <Field label="العنوان" span={2}><Input value={form.party_address} onChange={e => upd('party_address', e.target.value)} /></Field>
            </Grid>
          </Section>

          {/* Company */}
          <Section title="🏢 بيانات الشركة (اختياري)">
            <Grid>
              <Field label="اسم الشركة"><Input value={form.company_name} onChange={e => upd('company_name', e.target.value)} /></Field>
              <Field label="السجل التجاري"><Input value={form.commercial_registration} onChange={e => upd('commercial_registration', e.target.value)} /></Field>
              <Field label="الرقم الضريبي"><Input value={form.tax_number} onChange={e => upd('tax_number', e.target.value)} /></Field>
            </Grid>
          </Section>

          {/* Financials */}
          <Section title="💰 القيمة والمدة">
            <Grid>
              <Field label="القيمة"><Input type="number" value={form.contract_value} onChange={e => upd('contract_value', e.target.value)} /></Field>
              <Field label="العملة">
                <Select value={form.currency} onValueChange={v => upd('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">ريال سعودي</SelectItem>
                    <SelectItem value="USD">دولار أمريكي</SelectItem>
                    <SelectItem value="AED">درهم إماراتي</SelectItem>
                    <SelectItem value="EUR">يورو</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {showEquity && (
                <Field label="نسبة الحصص %"><Input type="number" value={form.equity_percentage} onChange={e => upd('equity_percentage', e.target.value)} /></Field>
              )}
              {showSalary && (
                <>
                  <Field label="الراتب الشهري"><Input type="number" value={form.monthly_salary} onChange={e => upd('monthly_salary', e.target.value)} /></Field>
                  <Field label="البدلات الشهرية"><Input type="number" value={form.monthly_bonus} onChange={e => upd('monthly_bonus', e.target.value)} /></Field>
                </>
              )}
              <Field label="تاريخ البداية"><Input type="date" value={form.start_date} onChange={e => upd('start_date', e.target.value)} /></Field>
              <Field label="تاريخ النهاية"><Input type="date" value={form.end_date} onChange={e => upd('end_date', e.target.value)} /></Field>
            </Grid>
          </Section>

          {/* Clauses */}
          <Section title="📜 بنود العقد (من القالب)">
            <div className="space-y-3">
              {clauses.map((c, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  <Input value={c.title} onChange={e => updClause(i, 'title', e.target.value)} className="font-semibold" />
                  <Textarea value={c.body} onChange={e => updClause(i, 'body', e.target.value)} rows={2} />
                </div>
              ))}
            </div>
          </Section>

          <Section title="➕ بنود مخصصة إضافية" action={
            <Button size="sm" variant="outline" onClick={addCustom}><Plus className="w-3 h-3 ml-1" />بند جديد</Button>
          }>
            <div className="space-y-3">
              {customClauses.length === 0 && <p className="text-xs text-muted-foreground">أضف بنوداً خاصة بهذا العقد إن لزم.</p>}
              {customClauses.map((c, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/30 relative">
                  <button onClick={() => rmCustom(i)} className="absolute top-2 left-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                  <Input value={c.title} onChange={e => updCustom(i, 'title', e.target.value)} className="font-semibold" />
                  <Textarea value={c.body} onChange={e => updCustom(i, 'body', e.target.value)} rows={2} />
                </div>
              ))}
            </div>
          </Section>

          <Section title="🗒️ ملاحظات داخلية">
            <Textarea value={form.notes} onChange={e => upd('notes', e.target.value)} rows={3} />
          </Section>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'إنشاء العقد'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ================= Detail Dialog ================= */
function ContractDetailDialog({
  contract, isCEO, myId, myName, onClose, onChange,
}: {
  contract: Contract; isCEO: boolean; myId: string | null; myName: string;
  onClose: () => void; onChange: () => void;
}) {
  const isParty = contract.generated_user_id === myId;
  const [attachments, setAttachments] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const loadAtt = async () => {
    const { data } = await supabase.from('contract_attachments')
      .select('*').eq('contract_id', contract.id).order('created_at', { ascending: false });
    setAttachments(data || []);
  };
  useEffect(() => { loadAtt(); }, [contract.id]);

  const meta = TYPE_META[contract.type];
  const st = STATUS_META[contract.status];

  // ---- Actions ----
  const setStatus = async (status: string, extra: any = {}) => {
    setBusy(true);
    await supabase.from('contracts').update({ status, ...extra }).eq('id', contract.id);
    await supabase.from('contract_activity').insert({
      contract_id: contract.id, action: `status:${status}`, actor_id: myId, actor_name: myName,
    });
    setBusy(false);
    onChange();
  };

  const signAsCEO = async () => {
    const sig = `${myName} — ${new Date().toISOString()}`;
    await supabase.from('contracts').update({
      ceo_signature_data: sig, ceo_signed_at: new Date().toISOString(),
      status: contract.party_signed_at ? 'signed' : 'awaiting_signature',
    }).eq('id', contract.id);
    toast.success('تم توقيعك على العقد');
    onChange();
  };
  const signAsParty = async () => {
    const sig = `${contract.party_name} — ${new Date().toISOString()}`;
    await supabase.from('contracts').update({
      party_signature_data: sig, party_signed_at: new Date().toISOString(),
      status: contract.ceo_signed_at ? 'signed' : 'awaiting_signature',
    }).eq('id', contract.id);
    toast.success('تم توقيعك');
    onChange();
  };

  const uploadFile = async (file: File, category: string) => {
    setBusy(true);
    const path = `${contract.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('contracts').upload(path, file);
    if (error) { toast.error(error.message); setBusy(false); return; }
    const { data: signed } = await supabase.storage.from('contracts').createSignedUrl(path, 60 * 60 * 24 * 365);
    await supabase.from('contract_attachments').insert({
      contract_id: contract.id, file_url: signed?.signedUrl || path, file_name: file.name,
      file_type: file.type, category, uploaded_by: myId,
    });
    if (category === 'party_documents' && !contract.documents_submitted_at) {
      await supabase.from('contracts').update({
        documents_submitted_at: new Date().toISOString(),
        status: 'awaiting_signature',
      }).eq('id', contract.id);
    }
    setBusy(false);
    await loadAtt();
    onChange();
    toast.success('تم رفع الملف');
  };

  const finalizeAndProvision = async () => {
    if (!contract.party_email) { toast.error('يجب إضافة بريد الطرف الآخر أولاً'); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('finalize-contract', {
      body: { contract_id: contract.id, role_slug: contract.type === 'partnership' ? 'coo' : 'coo' },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast.error('فشل التفعيل: ' + (error?.message || (data as any)?.error));
      return;
    }
    setCredentials({ email: (data as any).email, password: (data as any).password });
    toast.success('تم تفعيل العقد وإنشاء حساب الطرف');
    onChange();
  };

  const copyText = (t: string) => { navigator.clipboard.writeText(t); toast.success('تم النسخ'); };

  const printContract = () => {
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (!w) return;
    const allClauses = [...(contract.clauses || []), ...(contract.custom_clauses || [])];
    const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
      <title>${contract.contract_number}</title>
      <style>
        @page { size: A4; margin: 22mm 18mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Tajawal','Segoe UI',Arial,sans-serif; color: #111; line-height: 1.8; }
        .hdr { display:flex; justify-content:space-between; align-items:center; border-bottom:3px double #0f172a; padding-bottom:12px; margin-bottom:20px; }
        .hdr img { height:58px; }
        .brand { text-align:left; font-size:10pt; color:#334155; }
        h1 { text-align:center; font-size:22pt; margin:14px 0 4px; }
        .sub { text-align:center; color:#64748b; margin-bottom:22px; font-size:11pt; }
        .box { border:1px solid #cbd5e1; border-radius:8px; padding:12px 16px; margin:10px 0; background:#f8fafc; }
        .row { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; font-size:11pt; }
        .row div b { color:#0f172a; }
        h2 { font-size:13pt; border-right:4px solid #0f172a; padding-right:8px; margin:24px 0 8px; }
        .clause { margin:12px 0; page-break-inside: avoid; }
        .clause .t { font-weight:700; color:#0f172a; font-size:12pt; }
        .clause .b { margin-top:4px; font-size:11pt; color:#1e293b; text-align:justify; }
        .sig { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:60px; page-break-inside:avoid; }
        .sig .box2 { border-top:2px solid #0f172a; padding-top:8px; text-align:center; font-size:11pt; min-height:80px; }
        .sig .box2 .name { font-weight:700; margin-top:34px; }
        .footer { margin-top:40px; border-top:1px solid #cbd5e1; padding-top:10px; text-align:center; color:#64748b; font-size:9pt; }
        .stamp { color:#059669; font-size:10pt; margin-top:4px; }
      </style></head><body>
      <div class="hdr">
        <img src="${logo}" alt="BatShark"/>
        <div class="brand">
          <div><b>BatShark Economy Intelligence</b></div>
          <div>رقم العقد: ${contract.contract_number}</div>
          <div>${new Date().toLocaleDateString('ar-SA')}</div>
        </div>
      </div>
      <h1>${contract.title}</h1>
      <div class="sub">${meta?.label || ''} — ${STATUS_META[contract.status]?.label || ''}</div>

      <h2>الأطراف</h2>
      <div class="box">
        <div class="row">
          <div><b>الطرف الأول:</b> شركة BatShark</div>
          <div><b>الطرف الثاني:</b> ${contract.party_name}</div>
          ${contract.company_name ? `<div><b>الشركة:</b> ${contract.company_name}</div>` : ''}
          ${contract.commercial_registration ? `<div><b>السجل التجاري:</b> ${contract.commercial_registration}</div>` : ''}
          ${contract.tax_number ? `<div><b>الرقم الضريبي:</b> ${contract.tax_number}</div>` : ''}
          ${contract.party_national_id ? `<div><b>رقم الهوية:</b> ${contract.party_national_id}</div>` : ''}
          ${contract.party_phone ? `<div><b>الجوال:</b> ${contract.party_phone}</div>` : ''}
          ${contract.party_email ? `<div><b>البريد:</b> ${contract.party_email}</div>` : ''}
          ${contract.party_address ? `<div><b>العنوان:</b> ${contract.party_address}</div>` : ''}
        </div>
      </div>

      <h2>القيمة والمدة</h2>
      <div class="box">
        <div class="row">
          ${contract.contract_value ? `<div><b>القيمة:</b> ${Number(contract.contract_value).toLocaleString('ar')} ${contract.currency}</div>` : ''}
          ${contract.equity_percentage ? `<div><b>نسبة الحصص:</b> ${contract.equity_percentage}%</div>` : ''}
          ${contract.monthly_salary ? `<div><b>الراتب الشهري:</b> ${Number(contract.monthly_salary).toLocaleString('ar')} ${contract.currency}</div>` : ''}
          ${contract.monthly_bonus ? `<div><b>البدلات:</b> ${Number(contract.monthly_bonus).toLocaleString('ar')} ${contract.currency}</div>` : ''}
          ${contract.start_date ? `<div><b>البداية:</b> ${contract.start_date}</div>` : ''}
          ${contract.end_date ? `<div><b>النهاية:</b> ${contract.end_date}</div>` : ''}
        </div>
      </div>

      <h2>بنود العقد</h2>
      ${allClauses.map((c, i) => `
        <div class="clause">
          <div class="t">${i + 1}. ${c.title}</div>
          <div class="b">${(c.body || '').replace(/</g, '&lt;')}</div>
        </div>
      `).join('')}

      <div class="sig">
        <div class="box2">
          <div>الطرف الأول</div>
          <div class="name">BatShark — ${contract.ceo_signature_data ? contract.ceo_signature_data.split('—')[0] : '____________'}</div>
          ${contract.ceo_signed_at ? `<div class="stamp">✅ موقّع رقمياً — ${new Date(contract.ceo_signed_at).toLocaleString('ar-SA')}</div>` : ''}
        </div>
        <div class="box2">
          <div>الطرف الثاني</div>
          <div class="name">${contract.party_name}</div>
          ${contract.party_signed_at ? `<div class="stamp">✅ موقّع رقمياً — ${new Date(contract.party_signed_at).toLocaleString('ar-SA')}</div>` : ''}
        </div>
      </div>

      <div class="footer">
        BatShark © ${new Date().getFullYear()} — وثيقة رسمية — رقم ${contract.contract_number}
      </div>
      <script>window.onload=()=>{setTimeout(()=>window.print(),400)};<\/script>
      </body></html>`;
    w.document.write(html);
    w.document.close();
  };

  const allClauses = [...(contract.clauses || []), ...(contract.custom_clauses || [])];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <FileText className="w-5 h-5" /> {contract.title}
            <Badge variant="outline">{contract.contract_number}</Badge>
            <Badge className={st?.cls}>{st?.label}</Badge>
          </DialogTitle>
          <DialogDescription>{meta?.label}</DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 pb-2 border-b">
          <Button size="sm" variant="outline" onClick={printContract} className="gap-1">
            <Printer className="w-4 h-4" /> طباعة رسمية
          </Button>
          {isCEO && contract.status === 'draft' && (
            <Button size="sm" onClick={() => setStatus('awaiting_documents')} disabled={busy} className="gap-1">
              <Send className="w-4 h-4" /> إرسال للطرف الآخر
            </Button>
          )}
          {isCEO && !contract.ceo_signed_at && (
            <Button size="sm" variant="outline" onClick={signAsCEO} disabled={busy} className="gap-1">
              <PenLine className="w-4 h-4" /> توقيعي كرئيس تنفيذي
            </Button>
          )}
          {isParty && !contract.party_signed_at && contract.documents_submitted_at && (
            <Button size="sm" onClick={signAsParty} disabled={busy} className="gap-1">
              <PenLine className="w-4 h-4" /> توقيع الطرف الثاني
            </Button>
          )}
          {isCEO && contract.status === 'signed' && !contract.generated_user_id && (
            <Button size="sm" onClick={finalizeAndProvision} disabled={busy} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
              <KeyRound className="w-4 h-4" /> تفعيل العقد وإنشاء حساب الطرف
            </Button>
          )}
          {isCEO && ['active','signed'].includes(contract.status) && (
            <Button size="sm" variant="destructive" onClick={() => setStatus('terminated')} disabled={busy}>إنهاء العقد</Button>
          )}
        </div>

        {/* Credentials */}
        {credentials && (
          <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 space-y-2">
            <div className="font-semibold text-emerald-500 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> بيانات دخول الطرف الثاني (احفظها الآن)
            </div>
            <div className="text-sm flex items-center gap-2">
              <b>البريد:</b> <code className="bg-background px-2 py-0.5 rounded">{credentials.email}</code>
              <button onClick={() => copyText(credentials.email)}><Copy className="w-3 h-3" /></button>
            </div>
            <div className="text-sm flex items-center gap-2">
              <b>كلمة المرور:</b> <code className="bg-background px-2 py-0.5 rounded font-mono">{credentials.password}</code>
              <button onClick={() => copyText(credentials.password)}><Copy className="w-3 h-3" /></button>
            </div>
            <p className="text-xs text-muted-foreground">شارك هذه البيانات مع الطرف الآخر عبر قناة آمنة. لن تظهر مرة أخرى.</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* Party info */}
          <div className="rounded-xl border p-4 space-y-2">
            <h3 className="font-semibold mb-2">👤 الطرف الآخر</h3>
            <InfoRow k="الاسم" v={contract.party_name} />
            <InfoRow k="البريد" v={contract.party_email} />
            <InfoRow k="الجوال" v={contract.party_phone} />
            <InfoRow k="الهوية" v={contract.party_national_id} />
            <InfoRow k="العنوان" v={contract.party_address} />
            {contract.company_name && <>
              <div className="pt-2 border-t mt-2 font-semibold text-sm">🏢 الشركة</div>
              <InfoRow k="الاسم" v={contract.company_name} />
              <InfoRow k="السجل التجاري" v={contract.commercial_registration} />
              <InfoRow k="الرقم الضريبي" v={contract.tax_number} />
            </>}
          </div>

          <div className="rounded-xl border p-4 space-y-2">
            <h3 className="font-semibold mb-2">💰 القيمة والمدة</h3>
            {contract.contract_value && <InfoRow k="القيمة" v={`${Number(contract.contract_value).toLocaleString('ar')} ${contract.currency}`} />}
            {contract.equity_percentage != null && <InfoRow k="نسبة الحصص" v={`${contract.equity_percentage}%`} />}
            {contract.monthly_salary != null && <InfoRow k="الراتب الشهري" v={`${Number(contract.monthly_salary).toLocaleString('ar')} ${contract.currency}`} />}
            {contract.monthly_bonus != null && <InfoRow k="البدلات" v={`${Number(contract.monthly_bonus).toLocaleString('ar')} ${contract.currency}`} />}
            <InfoRow k="البداية" v={contract.start_date} />
            <InfoRow k="النهاية" v={contract.end_date} />
            <div className="pt-2 border-t mt-2 font-semibold text-sm">✍️ التوقيعات</div>
            <InfoRow k="الرئيس التنفيذي" v={contract.ceo_signed_at ? '✅ موقّع' : '⏳ لم يوقّع'} />
            <InfoRow k="الطرف الثاني" v={contract.party_signed_at ? '✅ موقّع' : '⏳ لم يوقّع'} />
          </div>
        </div>

        {/* Documents required */}
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-3">📎 المستندات المطلوبة من الطرف الآخر</h3>
          {(contract.required_documents || []).length === 0 && (
            <p className="text-xs text-muted-foreground">لا توجد مستندات مطلوبة.</p>
          )}
          <div className="space-y-2">
            {(contract.required_documents || []).map((doc, i) => {
              const uploaded = attachments.some(a => a.category === 'party_documents' && a.file_name.includes(doc.slice(0, 6)));
              return (
                <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/40">
                  <span>{doc}</span>
                  {uploaded ? <Badge className="bg-emerald-500/15 text-emerald-500">✔ مرفوع</Badge> :
                    <Badge variant="outline">لم يُرفع</Badge>}
                </div>
              );
            })}
          </div>
          {(isParty || isCEO) && (
            <label className="mt-3 flex items-center gap-2 text-sm border-2 border-dashed rounded-lg p-3 cursor-pointer hover:bg-muted/50">
              <UploadCloud className="w-5 h-5 text-primary" />
              <span>{isParty ? 'ارفع مستنداتك هنا' : 'رفع مستند'}</span>
              <input type="file" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (f) uploadFile(f, isParty ? 'party_documents' : 'ceo_documents');
              }} />
            </label>
          )}
        </div>

        {/* Attachments list */}
        {attachments.length > 0 && (
          <div className="rounded-xl border p-4">
            <h3 className="font-semibold mb-3">📁 كل المرفقات</h3>
            <div className="space-y-2">
              {attachments.map(a => (
                <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between text-sm p-2 rounded bg-muted/40 hover:bg-muted">
                  <span>{a.file_name}</span>
                  <Badge variant="outline">{a.category}</Badge>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Clauses */}
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-3">📜 بنود العقد</h3>
          <div className="space-y-3">
            {allClauses.map((c, i) => (
              <div key={i} className="border-r-2 border-primary/40 pr-3">
                <div className="font-semibold text-sm">{i + 1}. {c.title}</div>
                <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{c.body}</div>
              </div>
            ))}
          </div>
        </div>

        {contract.notes && (
          <div className="rounded-xl border p-4 bg-muted/30">
            <h3 className="font-semibold mb-2 text-sm">🗒️ ملاحظات</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.notes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ================= tiny helpers ================= */
function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : ''}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
function InfoRow({ k, v }: { k: string; v: any }) {
  if (v == null || v === '') return null;
  return (
    <div className="flex justify-between text-sm gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{String(v)}</span>
    </div>
  );
}
