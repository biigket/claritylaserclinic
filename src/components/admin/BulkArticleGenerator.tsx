import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, CheckCircle, XCircle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-ai-assistant`;
const COVER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-generate-cover`;
const blogTable = () => supabase.from("blog_articles") as any;

type ArticleStatus = "pending" | "generating" | "cover" | "saving" | "done" | "error";

interface ArticleJob {
  prompt: string;
  status: ArticleStatus;
  title?: string;
  error?: string;
}

function parseArticleJson(text: string) {
  try {
    const parsed = JSON.parse(text);
    if (parsed.content_th || parsed.title_th) return parsed;
  } catch {
    const match = text.match(/\{[\s\S]*"content_th"[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* ignore */ }
    }
  }
  return null;
}

async function generateArticleContent(prompt: string): Promise<Record<string, any>> {
  const messages = [
    { role: "user" as const, content: prompt },
  ];

  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) fullText += content;
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  const article = parseArticleJson(fullText);
  if (!article) throw new Error("AI ไม่สามารถสร้างบทความในรูปแบบ JSON ได้");
  return article;
}

async function generateCover(title: string, excerpt?: string, tags?: string): Promise<string> {
  const resp = await fetch(COVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ title, excerpt, tags }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || "สร้างรูปปกล้มเหลว");
  return data.url;
}

const BulkArticleGenerator = () => {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [prompts, setPrompts] = useState<string[]>(Array(5).fill(""));
  const [jobs, setJobs] = useState<ArticleJob[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCountChange = (val: number[]) => {
    const n = val[0];
    setCount(n);
    setPrompts((prev) => {
      const next = Array(n).fill("");
      prev.forEach((p, i) => { if (i < n) next[i] = p; });
      return next;
    });
  };

  const setPrompt = (i: number, v: string) => {
    setPrompts((prev) => prev.map((p, idx) => (idx === i ? v : p)));
  };

  const updateJob = (i: number, patch: Partial<ArticleJob>) => {
    setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, ...patch } : j)));
  };

  const completedCount = jobs.filter((j) => j.status === "done").length;
  const errorCount = jobs.filter((j) => j.status === "error").length;

  // Weight each step so progress moves continuously
  const stepWeight: Record<ArticleStatus, number> = {
    pending: 0,
    generating: 0.2,
    cover: 0.5,
    saving: 0.8,
    done: 1,
    error: 1,
  };
  const progress = jobs.length > 0
    ? (jobs.reduce((sum, j) => sum + stepWeight[j.status], 0) / jobs.length) * 100
    : 0;

  const handleGenerate = async () => {
    const validPrompts = prompts.filter((p) => p.trim());
    if (validPrompts.length === 0) {
      toast({ title: "กรุณากรอก prompt อย่างน้อย 1 รายการ", variant: "destructive" });
      return;
    }

    abortRef.current = false;
    setIsRunning(true);
    const initialJobs: ArticleJob[] = validPrompts.map((p) => ({ prompt: p, status: "pending" }));
    setJobs(initialJobs);

    const { data: { user } } = await supabase.auth.getUser();

    const CONCURRENCY = 3;

    const processOne = async (i: number) => {
      if (abortRef.current) return;
      updateJob(i, { status: "generating" });
      try {
        const article = await generateArticleContent(validPrompts[i]);
        updateJob(i, { title: article.title_th || article.title_en || `บทความ ${i + 1}` });
        if (abortRef.current) return;

        updateJob(i, { status: "cover" });
        let coverUrl = "";
        try {
          coverUrl = await generateCover(
            article.title_th || article.title_en || "",
            article.excerpt_th || article.excerpt_en,
            article.tags?.join(", ")
          );
        } catch (coverErr) {
          console.warn("Cover generation failed:", coverErr);
        }
        if (abortRef.current) return;

        updateJob(i, { status: "saving" });
        let slug = article.slug || `article-${Date.now()}-${i}`;
        const { data: existing } = await blogTable().select("id").eq("slug", slug).maybeSingle();
        if (existing) slug = `${slug}-${Date.now()}`;

        const payload = {
          slug,
          status: "draft",
          title_th: article.title_th || "",
          title_en: article.title_en || null,
          excerpt_th: article.excerpt_th || null,
          excerpt_en: article.excerpt_en || null,
          content_th: article.content_th || "",
          content_en: article.content_en || null,
          cover_image_url: coverUrl || null,
          tags: article.tags || [],
          meta_title_th: article.meta_title_th || null,
          meta_title_en: article.meta_title_en || null,
          meta_description_th: article.meta_description_th || null,
          meta_description_en: article.meta_description_en || null,
          created_by: user?.id,
        };

        const { error } = await blogTable().insert(payload);
        if (error) throw new Error(error.message);
        updateJob(i, { status: "done" });
      } catch (err: any) {
        updateJob(i, { status: "error", error: err.message });
      }
    };

    // Process in parallel batches of CONCURRENCY
    for (let start = 0; start < validPrompts.length; start += CONCURRENCY) {
      if (abortRef.current) break;
      const batch = Array.from(
        { length: Math.min(CONCURRENCY, validPrompts.length - start) },
        (_, k) => start + k
      );
      await Promise.all(batch.map(processOne));
    }

    setIsRunning(false);
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    toast({
      title: `สร้างบทความเสร็จสิ้น`,
      description: `สำเร็จ ${jobs.filter((j) => j.status === "done").length + (jobs[jobs.length - 1]?.status === "done" ? 0 : 0)} จาก ${validPrompts.length} บทความ`,
    });
  };

  const handleStop = () => {
    abortRef.current = true;
  };

  const statusLabel: Record<ArticleStatus, string> = {
    pending: "รอคิว",
    generating: "กำลังเขียน...",
    cover: "สร้างรูปปก...",
    saving: "บันทึก...",
    done: "สำเร็จ ✓",
    error: "ผิดพลาด ✗",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isRunning) setOpen(v); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5">
          <Zap className="w-3.5 h-3.5" />
          สร้างบทความอัตโนมัติ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            สร้างบทความอัตโนมัติ (Bulk)
          </DialogTitle>
          <DialogDescription className="text-xs">
            ใส่ prompt ตามจำนวนที่ต้องการ ระบบจะสร้างบทความ + รูปปก + บันทึกลงฐานข้อมูลอัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        {!isRunning && jobs.length === 0 && (
          <div className="space-y-5 flex-1 overflow-y-auto">
            {/* Count selector */}
            <div className="space-y-2">
              <Label className="text-xs">จำนวนบทความ: <strong>{count}</strong></Label>
              <Slider
                value={[count]}
                onValueChange={handleCountChange}
                min={2}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>2</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Prompts */}
            <div className="space-y-2">
              <Label className="text-xs">Prompts ({count} รายการ)</Label>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {prompts.map((p, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-[10px] text-muted-foreground mt-2.5 w-6 text-right shrink-0">{i + 1}.</span>
                    <Textarea
                      value={p}
                      onChange={(e) => setPrompt(i, e.target.value)}
                      placeholder={`เช่น "เขียนบทความเรื่องหลุมสิว รักษาด้วยเลเซอร์ CO2"`}
                      rows={1}
                      className="text-xs resize-none flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Fill helper */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] h-7"
                onClick={() => {
                  const topics = [
                    "เขียนบทความเรื่องการรักษาหลุมสิวด้วยเลเซอร์ที่ Clarity Laser Clinic ย่านราชเทวี",
                    "เขียนบทความเรื่องการดูแลผิวหน้าหลังทำเลเซอร์ที่ Clarity Laser Clinic ใกล้ BTS พญาไท",
                    "เขียนบทความเรื่อง Ultherapy ยกกระชับผิวหน้าไม่ต้องผ่าตัดที่ Clarity Laser Clinic ย่านสยาม",
                    "เขียนบทความเรื่องเลเซอร์ลดรอยดำจากสิวที่ Clarity Laser Clinic ราชเทวี",
                    "เขียนบทความเรื่อง Pico Laser รักษาฝ้ากระที่ Clarity Laser Clinic ใกล้ BTS พญาไท",
                    "เขียนบทความเรื่องการทำ Botox ลดริ้วรอยที่ Clarity Laser Clinic ย่านราชเทวี",
                    "เขียนบทความเรื่อง Filler เติมเต็มร่องแก้มที่ Clarity Laser Clinic ย่านสยาม",
                    "เขียนบทความเรื่องการรักษารูขุมขนกว้างด้วยเลเซอร์ที่ Clarity Laser Clinic ราชเทวี",
                    "เขียนบทความเรื่อง RF Microneedling กระชับผิวที่ Clarity Laser Clinic ใกล้ BTS พญาไท",
                    "เขียนบทความเรื่องการดูแลผิวแพ้ง่ายที่ Clarity Laser Clinic ย่านราชเทวี",
                  ];
                  setPrompts((prev) => prev.map((p, i) => p || topics[i % topics.length]));
                }}
              >
                เติม prompt ตัวอย่าง
              </Button>
            </div>

            <Button onClick={handleGenerate} className="w-full gap-2" disabled={prompts.every((p) => !p.trim())}>
              <Sparkles className="w-4 h-4" />
              เริ่มสร้าง {prompts.filter((p) => p.trim()).length} บทความ
            </Button>
          </div>
        )}

        {/* Progress view */}
        {(isRunning || jobs.length > 0) && (
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  สำเร็จ {completedCount}/{jobs.length} | ผิดพลาด {errorCount}
                </span>
                {isRunning && (
                  <Button variant="destructive" size="sm" className="text-xs h-7" onClick={handleStop}>
                    หยุด
                  </Button>
                )}
              </div>
              <Progress value={progress} className="h-2 transition-all duration-500" />
            </div>

            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
              {jobs.map((job, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                    job.status === "done"
                      ? "border-green-200 bg-green-50"
                      : job.status === "error"
                      ? "border-destructive/30 bg-destructive/5"
                      : job.status === "pending"
                      ? "border-border bg-muted/30"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <span className="w-5 text-center text-muted-foreground">{i + 1}</span>
                  {(job.status === "generating" || job.status === "cover" || job.status === "saving") && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                  )}
                  {job.status === "done" && <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                  {job.status === "error" && <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{job.title || job.prompt.slice(0, 60)}</p>
                    {job.error && <p className="text-destructive text-[10px] truncate">{job.error}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {statusLabel[job.status]}
                  </span>
                </div>
              ))}
            </div>

            {!isRunning && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => { setJobs([]); setPrompts(Array(count).fill("")); }}
                >
                  สร้างชุดใหม่
                </Button>
                <Button className="flex-1 text-xs" onClick={() => setOpen(false)}>
                  ปิด
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkArticleGenerator;
