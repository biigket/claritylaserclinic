import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Wand2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface CanvasInput {
  topic: string;
  brand: string;
  author: string;
  audience: string;
  dataPoints: string;
  language: string;
  length: string;
}

interface Props {
  onGenerate: (input: CanvasInput) => void;
  isGenerating: boolean;
}

const AUTOFILL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/canvas-autofill`;
const STORAGE_KEY = "canvas-last-inputs";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="mt-1">{children}</div>
  </div>
);

const CanvasInputForm = ({ onGenerate, isGenerating }: Props) => {
  const { toast } = useToast();
  const [quickPrompt, setQuickPrompt] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const [form, setForm] = useState<CanvasInput>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      topic: "",
      brand: "Clarity Laser Clinic",
      author: "นพ.ฐิติคมน์ 61395, แพทย์ผู้เชี่ยวชาญด้านผิวหนังและเลเซอร์",
      audience: "",
      dataPoints: "",
      language: "Both",
      length: "medium",
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const set = (key: keyof CanvasInput, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleAutoFill = async () => {
    if (!quickPrompt.trim()) return;
    setIsAutoFilling(true);
    try {
      const resp = await fetch(AUTOFILL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: quickPrompt }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);

      setForm((prev) => ({
        ...prev,
        ...(data.topic && { topic: data.topic }),
        ...(data.brand && { brand: data.brand }),
        ...(data.author && { author: data.author }),
        ...(data.audience && { audience: data.audience }),
        ...(data.dataPoints && { dataPoints: data.dataPoints }),
      }));
      toast({ title: "AI กรอกฟอร์มให้แล้ว ✨" });
    } catch (e: any) {
      toast({ title: "Auto-fill ล้มเหลว", description: e.message, variant: "destructive" });
    } finally {
      setIsAutoFilling(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* AI Quick Fill */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
        <Label className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5" />
          AI Auto-Fill — พิมพ์ prompt เดียว กรอกทุกช่อง
        </Label>
        <div className="flex gap-2">
          <Input
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            placeholder='เช่น "เขียนเรื่องหลุมสิว" หรือ "Doublo treatment guide"'
            className="text-sm flex-1"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAutoFill(); } }}
          />
          <Button size="sm" onClick={handleAutoFill} disabled={isAutoFilling || !quickPrompt.trim()} className="gap-1.5 shrink-0">
            {isAutoFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            AI Fill
          </Button>
        </div>
      </div>

      <Field label="หัวข้อบทความ / Keyword *">
        <Input value={form.topic} onChange={(e) => set("topic", e.target.value)} placeholder="เช่น การรักษาหลุมสิวด้วยเลเซอร์" className="text-sm" />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="ชื่อแบรนด์ / องค์กร">
          <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} className="text-sm" />
        </Field>
        <Field label="ชื่อผู้เชี่ยวชาญ + ตำแหน่ง">
          <Input value={form.author} readOnly className="text-sm bg-muted/50 cursor-default" />
        </Field>
      </div>

      <Field label="กลุ่มเป้าหมาย">
        <Input value={form.audience} onChange={(e) => set("audience", e.target.value)} placeholder="เช่น ผู้หญิงวัย 25-45 ที่มีปัญหาหลุมสิว" className="text-sm" />
      </Field>

      <Field label="ข้อมูล / สถิติสำคัญ">
        <Textarea value={form.dataPoints} onChange={(e) => set("dataPoints", e.target.value)} placeholder="ตัวเลข เคส ผลลัพธ์ที่อยากใส่ในบทความ..." rows={3} className="text-sm" />
      </Field>

      <Field label="ความยาว">
        <Select value={form.length} onValueChange={(v) => set("length", v)}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="short">สั้น ~800 คำ/ภาษา</SelectItem>
            <SelectItem value="medium">กลาง ~1,500 คำ/ภาษา</SelectItem>
            <SelectItem value="long">ยาว ~2,500 คำ/ภาษา</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <div className="bg-muted/50 rounded-lg p-3 text-[10px] text-muted-foreground space-y-1">
        <p>🌐 <strong>บทความจะสร้าง 2 ภาษาอัตโนมัติ</strong> (ไทย + อังกฤษ)</p>
        <p>📍 สอดแทรก Local SEO: ราชเทวี, พญาไท, สยาม, Clarity Laser Clinic</p>
        <p>🔗 Internal links จากบทความที่เผยแพร่แล้วจะถูกสอดแทรกอัตโนมัติ</p>
      </div>

      <Button onClick={() => onGenerate(form)} disabled={!form.topic.trim() || isGenerating} className="w-full gap-2 h-12 text-base" size="lg">
        <Sparkles className="w-5 h-5" />
        {isGenerating ? "กำลังสร้างบทความ 2 ภาษา..." : "สร้างบทความ (TH + EN)"}
      </Button>
    </div>
  );
};

export default CanvasInputForm;
