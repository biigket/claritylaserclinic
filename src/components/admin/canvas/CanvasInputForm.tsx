import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface CanvasInput {
  topic: string;
  brand: string;
  author: string;
  industry: string;
  audience: string;
  language: string;
  contentType: string;
  dataPoints: string;
  publicationDate: string;
}

interface Props {
  onGenerate: (input: CanvasInput) => void;
  isGenerating: boolean;
}

const INDUSTRIES = [
  "Medical Aesthetics",
  "Healthcare",
  "Technology",
  "Finance",
  "Education",
  "Real Estate",
  "Food & Beverage",
  "Travel & Tourism",
  "E-commerce",
  "Other",
];

const CONTENT_TYPES = [
  { value: "blog", label: "Blog Post" },
  { value: "press", label: "Press Release" },
  { value: "landing", label: "Landing Page" },
  { value: "knowledge", label: "Knowledge Article" },
];

const Field = ({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
      {label} {sublabel && <span className="normal-case text-[10px]">({sublabel})</span>}
    </Label>
    <div className="mt-1">{children}</div>
  </div>
);

const CanvasInputForm = ({ onGenerate, isGenerating }: Props) => {
  const [form, setForm] = useState<CanvasInput>({
    topic: "",
    brand: "Clarity Laser Clinic",
    author: "",
    industry: "Medical Aesthetics",
    audience: "",
    language: "Thai",
    contentType: "blog",
    dataPoints: "",
    publicationDate: new Date().toISOString().split("T")[0],
  });
  const [date, setDate] = useState<Date>(new Date());

  const set = (key: keyof CanvasInput, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleDateSelect = (d: Date | undefined) => {
    if (d) {
      setDate(d);
      set("publicationDate", d.toISOString().split("T")[0]);
    }
  };

  return (
    <div className="space-y-5">
      <Field label="Topic / Keyword" sublabel="หัวข้อหลัก">
        <Input
          value={form.topic}
          onChange={(e) => set("topic", e.target.value)}
          placeholder="เช่น การรักษาหลุมสิวด้วยเลเซอร์"
          className="text-sm"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Brand / Entity Name" sublabel="แบรนด์">
          <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} className="text-sm" />
        </Field>
        <Field label="Author / Expert" sublabel="ผู้เชี่ยวชาญ">
          <Input
            value={form.author}
            onChange={(e) => set("author", e.target.value)}
            placeholder="เช่น Dr. Tinn, Board-Certified Dermatologist"
            className="text-sm"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Industry / Niche">
          <Select value={form.industry} onValueChange={(v) => set("industry", v)}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Language" sublabel="ภาษา">
          <Select value={form.language} onValueChange={(v) => set("language", v)}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Thai">ไทย</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Both">Both (TH + EN)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Content Type" sublabel="ประเภท">
          <Select value={form.contentType} onValueChange={(v) => set("contentType", v)}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Target Audience" sublabel="กลุ่มเป้าหมาย">
        <Input
          value={form.audience}
          onChange={(e) => set("audience", e.target.value)}
          placeholder="เช่น ผู้หญิงอายุ 25-40 ปี ที่มีปัญหาหลุมสิว"
          className="text-sm"
        />
      </Field>

      <Field label="Key Data Points" sublabel="ข้อมูลสถิติ / กรณีศึกษา">
        <Textarea
          value={form.dataPoints}
          onChange={(e) => set("dataPoints", e.target.value)}
          placeholder="เช่น รักษาผู้ป่วยกว่า 500 ราย ผลลัพธ์ดีขึ้น 85% ใน 3 เดือน..."
          rows={3}
          className="text-sm"
        />
      </Field>

      <div className="flex items-end gap-4">
        <Field label="Publication Date" sublabel="วันที่เผยแพร่">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[200px] justify-start text-left text-sm font-normal", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "เลือกวันที่"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </Field>

        <Button
          onClick={() => onGenerate(form)}
          disabled={!form.topic.trim() || isGenerating}
          className="gap-2 px-6"
          size="lg"
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? "กำลังสร้าง..." : "Generate Content Canvas"}
        </Button>
      </div>
    </div>
  );
};

export default CanvasInputForm;
