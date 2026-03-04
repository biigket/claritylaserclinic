import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { Sparkles, Loader2, CheckCircle, XCircle, Zap, Eye, Send, CheckCheck, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-ai-assistant`;
const COVER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-generate-cover`;
const blogTable = () => supabase.from("blog_articles") as any;

type ArticleStep = "pending" | "generating" | "cover" | "saving" | "done" | "error" | "published";

interface ArticleJob {
  prompt: string;
  step: ArticleStep;
  progress: number; // 0-100
  title?: string;
  error?: string;
  articleId?: string;
  slug?: string;
  coverUrl?: string;
}

const STEP_PROGRESS: Record<ArticleStep, number> = {
  pending: 0,
  generating: 30,
  cover: 60,
  saving: 85,
  done: 100,
  error: 100,
  published: 100,
};

const STEP_LABEL: Record<ArticleStep, string> = {
  pending: "⏳ รอคิว",
  generating: "✍️ กำลังเขียนบทความ...",
  cover: "🎨 สร้างรูปปก...",
  saving: "💾 บันทึกลงฐานข้อมูล...",
  done: "✅ สำเร็จ (ร่าง)",
  error: "❌ ผิดพลาด",
  published: "🟢 เผยแพร่แล้ว",
};

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

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} หมดเวลา (${ms / 1000}s)`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

async function streamArticleContent(
  prompt: string,
  onProgress: (pct: number) => void,
  abortSignal?: AbortSignal
): Promise<Record<string, any>> {
  const resp = await withTimeout(
    fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      signal: abortSignal,
    }),
    120_000,
    "AI เขียนบทความ"
  );

  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let fullText = "";
  let chunkCount = 0;

  try {
    while (true) {
      if (abortSignal?.aborted) throw new Error("ถูกยกเลิก");
      const { done, value } = await withTimeout(reader.read(), 60_000, "รอข้อมูลจาก AI");
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });
      chunkCount++;

      const streamPct = Math.min(28, 5 + chunkCount * 0.5);
      onProgress(streamPct);

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
  } finally {
    reader.releaseLock();
  }

  onProgress(30);
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

// ─── Component ───────────────────────────────────

const BulkArticleGenerator = () => {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [prompts, setPrompts] = useState<string[]>(Array(5).fill(""));
  const [jobs, setJobs] = useState<ArticleJob[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const abortRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
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

  const handleGeneratePrompts = async () => {
    if (!aiInstruction.trim()) {
      toast({ title: "กรุณาใส่คำสั่งก่อน", variant: "destructive" });
      return;
    }
    setIsGeneratingPrompts(true);
    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `สร้าง prompt สำหรับเขียนบทความบล็อก จำนวน ${count} prompt ตามคำสั่งนี้: "${aiInstruction}"

กฎ:
- ตอบเป็น JSON array เท่านั้น เช่น ["prompt 1", "prompt 2", ...]
- แต่ละ prompt ต้องเป็นคำสั่งเขียนบทความที่ชัดเจน มี keyword และ location ของ Clarity Laser Clinic (ราชเทวี, ใกล้ BTS พญาไท, ย่านสยาม)
- ห้ามซ้ำกัน แต่ละอันต้องเป็นหัวข้อที่แตกต่างกัน
- ต้องมีจำนวนครบ ${count} prompt
- ห้ามใส่ markdown code block ครอบ
- ตอบ JSON array เท่านั้น ไม่ต้องมีข้อความอื่น`,
            },
          ],
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      // Parse SSE stream
      const reader = resp.body!.getReader();
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
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullText += content;
          } catch { /* partial */ }
        }
      }

      const match = fullText.match(/\[[\s\S]*\]/);
      if (match) {
        const promptsArr = JSON.parse(match[0]) as string[];
        setPrompts(prev => prev.map((_, i) => promptsArr[i] || ""));
        toast({ title: `สร้าง ${Math.min(promptsArr.length, count)} prompts สำเร็จ` });
      } else {
        throw new Error("AI ไม่สามารถสร้าง prompts ได้");
      }
    } catch (err: any) {
      console.error("Generate prompts error:", err);
      toast({ title: "สร้าง prompts ไม่สำเร็จ", description: err.message, variant: "destructive" });
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const patchJob = useCallback((i: number, patch: Partial<ArticleJob>) => {
    setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, ...patch } : j)));
  }, []);

  const completedCount = jobs.filter((j) => j.step === "done" || j.step === "published").length;
  const errorCount = jobs.filter((j) => j.step === "error").length;
  const totalProgress = jobs.length > 0
    ? jobs.reduce((sum, j) => sum + j.progress, 0) / jobs.length
    : 0;

  const handleStop = useCallback(() => {
    abortRef.current = true;
    abortControllerRef.current?.abort();
    setIsRunning(false);
    // Mark pending jobs as error
    setJobs((prev) => prev.map((j) =>
      j.step === "pending" || j.step === "generating" || j.step === "cover" || j.step === "saving"
        ? { ...j, step: "error", progress: 100, error: "ถูกยกเลิก" }
        : j
    ));
  }, []);

  const handleGenerate = async () => {
    const validPrompts = prompts.filter((p) => p.trim());
    if (validPrompts.length === 0) {
      toast({ title: "กรุณากรอก prompt อย่างน้อย 1 รายการ", variant: "destructive" });
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    abortRef.current = false;
    setIsRunning(true);
    const initialJobs: ArticleJob[] = validPrompts.map((p) => ({ prompt: p, step: "pending" as ArticleStep, progress: 0 }));
    setJobs(initialJobs);

    const { data: { user } } = await supabase.auth.getUser();
    const CONCURRENCY = 2;

    const processOne = async (i: number) => {
      if (abortRef.current) {
        patchJob(i, { step: "error", progress: 100, error: "ถูกยกเลิก" });
        return;
      }

      patchJob(i, { step: "generating", progress: 5 });
      try {
        const article = await streamArticleContent(validPrompts[i], (pct) => {
          patchJob(i, { progress: pct });
        }, controller.signal);
        patchJob(i, { title: article.title_th || article.title_en || `บทความ ${i + 1}`, progress: 30 });
        if (abortRef.current) throw new Error("ถูกยกเลิก");

        // Step 2: Generate cover
        patchJob(i, { step: "cover", progress: 35 });
        let coverUrl = "";
        try {
          const coverTimer = setInterval(() => {
            patchJob(i, { progress: Math.min(58, 35 + Math.random() * 5) });
          }, 2000);
          coverUrl = await withTimeout(
            generateCover(
              article.title_th || article.title_en || "",
              article.excerpt_th || article.excerpt_en,
              article.tags?.join(", ")
            ),
            90_000,
            "สร้างรูปปก"
          );
          clearInterval(coverTimer);
        } catch (coverErr) {
          console.warn("Cover generation failed:", coverErr);
        }
        patchJob(i, { progress: 60, coverUrl: coverUrl || undefined });
        if (abortRef.current) throw new Error("ถูกยกเลิก");

        // Step 3: Save to database
        patchJob(i, { step: "saving", progress: 70 });
        let slug = article.slug || `article-${Date.now()}-${i}`;
        const { data: existing } = await blogTable().select("id").eq("slug", slug).maybeSingle();
        if (existing) slug = `${slug}-${Date.now()}`;

        patchJob(i, { progress: 80 });

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

        const { data: inserted, error } = await blogTable().insert(payload).select("id, slug").single();
        if (error) throw new Error(error.message);

        patchJob(i, {
          step: "done",
          progress: 100,
          articleId: inserted?.id,
          slug: inserted?.slug || slug,
        });
      } catch (err: any) {
        patchJob(i, { step: "error", progress: 100, error: err.message });
      }
    };

    for (let start = 0; start < validPrompts.length; start += CONCURRENCY) {
      if (abortRef.current) break;
      const batch = Array.from(
        { length: Math.min(CONCURRENCY, validPrompts.length - start) },
        (_, k) => start + k
      );
      await Promise.all(batch.map(processOne));
    }

    setIsRunning(false);
    abortControllerRef.current = null;
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    toast({ title: "สร้างบทความเสร็จสิ้น" });
  };

  const handlePublish = async (i: number) => {
    const job = jobs[i];
    if (!job.articleId) return;
    const { error } = await blogTable()
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", job.articleId);
    if (error) {
      toast({ title: "เผยแพร่ไม่สำเร็จ", description: error.message, variant: "destructive" });
    } else {
      patchJob(i, { step: "published" });
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    }
  };

  const handlePublishAll = async () => {
    const draftJobs = jobs
      .map((j, i) => ({ j, i }))
      .filter(({ j }) => j.step === "done" && j.articleId);
    for (const { i } of draftJobs) {
      await handlePublish(i);
    }
    toast({ title: `เผยแพร่ ${draftJobs.length} บทความแล้ว` });
  };

  const draftCount = jobs.filter((j) => j.step === "done").length;

  return (
    <Dialog open={open} onOpenChange={(v) => { console.log("BulkDialog onOpenChange:", v, "isRunning:", isRunning); if (isRunning && !v) { handleStop(); } setOpen(v); }}>
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
            ใส่ prompt ตามจำนวนที่ต้องการ ระบบจะสร้างบทความ + รูปปก + บันทึกอัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        {/* ─── Setup view ─── */}
        {!isRunning && jobs.length === 0 && (
          <div className="space-y-5 flex-1 overflow-y-auto">
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
                <span>2</span><span>50</span><span>100</span>
              </div>
            </div>

            {/* AI Prompt Generator */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-primary" />
                AI สร้าง Prompt อัตโนมัติ
              </Label>
              <div className="flex gap-2">
                <Input
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder={`เช่น "บทความเกี่ยวกับการดูแลผิวหน้า" หรือ "เลเซอร์รักษาหลุมสิว"`}
                  className="text-xs flex-1"
                  disabled={isGeneratingPrompts}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs gap-1.5 shrink-0"
                  onClick={handleGeneratePrompts}
                  disabled={isGeneratingPrompts || !aiInstruction.trim()}
                >
                  {isGeneratingPrompts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  {isGeneratingPrompts ? "กำลังสร้าง..." : `สร้าง ${count} Prompts`}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">ใส่คำสั่งกว้างๆ แล้ว AI จะสร้าง prompt ละเอียดตามจำนวนบทความที่ตั้งไว้</p>
            </div>

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

        {/* ─── Progress view ─── */}
        {(isRunning || jobs.length > 0) && (
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* Overall progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  ทั้งหมด {Math.round(totalProgress)}% — สำเร็จ {completedCount}/{jobs.length} | ผิดพลาด {errorCount}
                </span>
                {isRunning && (
                  <Button variant="destructive" size="sm" className="text-xs h-7" onClick={handleStop}>
                    หยุด
                  </Button>
                )}
              </div>
              <Progress value={totalProgress} className="h-2" />
            </div>

            {/* Per-article cards */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {jobs.map((job, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 text-xs space-y-2 transition-colors ${
                    job.step === "done" ? "border-primary/30 bg-primary/5"
                    : job.step === "published" ? "border-green-300 bg-green-50"
                    : job.step === "error" ? "border-destructive/30 bg-destructive/5"
                    : job.step === "pending" ? "border-border bg-muted/20"
                    : "border-primary/20 bg-primary/5"
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center text-muted-foreground font-medium">{i + 1}</span>
                    {(job.step === "generating" || job.step === "cover" || job.step === "saving") && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                    )}
                    {job.step === "done" && <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />}
                    {job.step === "published" && <CheckCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                    {job.step === "error" && <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{job.title || job.prompt.slice(0, 60)}</p>
                    </div>
                  </div>

                  {/* Per-article progress bar */}
                  <div className="flex items-center gap-2">
                    <Progress value={job.progress} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{Math.round(job.progress)}%</span>
                  </div>

                  {/* Status label */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{STEP_LABEL[job.step]}</span>

                    {/* Action buttons */}
                    <div className="flex gap-1">
                      {(job.step === "done" || job.step === "published") && job.slug && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] gap-1"
                          onClick={() => window.open(`/blog/${job.slug}`, "_blank")}
                        >
                          <Eye className="w-3 h-3" />
                          Preview
                        </Button>
                      )}
                      {job.step === "done" && job.articleId && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-6 px-2 text-[10px] gap-1"
                          onClick={() => handlePublish(i)}
                        >
                          <Send className="w-3 h-3" />
                          เผยแพร่
                        </Button>
                      )}
                    </div>
                  </div>

                  {job.error && <p className="text-destructive text-[10px]">{job.error}</p>}
                </div>
              ))}
            </div>

            {/* Bottom actions */}
            {!isRunning && (
              <div className="flex gap-2">
                {draftCount > 0 && (
                  <Button
                    onClick={handlePublishAll}
                    className="flex-1 text-xs gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    เผยแพร่ทั้งหมด ({draftCount})
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => { setJobs([]); setPrompts(Array(count).fill("")); }}
                >
                  สร้างชุดใหม่
                </Button>
                <Button variant="secondary" className="text-xs" onClick={() => setOpen(false)}>
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
