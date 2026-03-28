import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, CheckCircle, XCircle, Zap, Eye, Send, CheckCheck, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import type { ArticleData } from "./ArticlePreview";

const CANVAS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-canvas-generate`;
const COVER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-generate-cover`;
const AUTOFILL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/canvas-autofill`;
const blogTable = () => supabase.from("blog_articles") as any;

type ArticleStep = "pending" | "generating" | "cover" | "saving" | "done" | "error" | "published";

interface ArticleJob {
  prompt: string;
  step: ArticleStep;
  progress: number;
  title?: string;
  error?: string;
  articleId?: string;
  slug?: string;
  coverUrl?: string;
}

const STEP_LABEL: Record<ArticleStep, string> = {
  pending: "⏳ รอคิว",
  generating: "✍️ กำลังสร้างบทความ Canvas...",
  cover: "🎨 สร้างรูปปก...",
  saving: "💾 บันทึก + บันทึกหัวข้อที่เกี่ยวข้อง...",
  done: "✅ สำเร็จ (ร่าง)",
  error: "❌ ผิดพลาด",
  published: "🟢 เผยแพร่แล้ว",
};

function tryParseArticleJson(text: string): ArticleData | null {
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.title_th || parsed.body_sections) return parsed;
  } catch {
    const match = cleaned.match(/\{[\s\S]*"body_sections"[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* */ }
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

function buildContent(articleData: ArticleData, lang: "th" | "en") {
  const t = (th?: string, en?: string) => lang === "th" ? (th || en || "") : (en || th || "");
  const parts: string[] = [];

  const bullets = lang === "th" ? articleData.tldr_bullets_th : articleData.tldr_bullets_en;
  if (bullets?.length) parts.push(`> **TL;DR**\n${bullets.map((b) => `- ${b}`).join("\n")}`);

  const bio = t(articleData.author_bio_th, articleData.author_bio_en);
  if (bio) parts.push(`*${bio}*`);

  articleData.body_sections?.forEach((s) => {
    parts.push(`## ${t(s.heading_th, s.heading_en)}\n\n${t(s.content_th, s.content_en)}`);
  });

  articleData.expert_quotes?.forEach((q) => {
    parts.push(`> "${t(q.quote_th, q.quote_en)}"\n> — *${q.attribution}*`);
  });

  const takeaways = lang === "th" ? articleData.key_takeaways_th : articleData.key_takeaways_en;
  if (takeaways?.length) parts.push(`## ${lang === "th" ? "สรุปสำคัญ" : "Key Takeaways"}\n\n${takeaways.map((k) => `- ${k}`).join("\n")}`);

  if (articleData.faq_items?.length) {
    parts.push(`## ${lang === "th" ? "คำถามที่พบบ่อย" : "FAQ"}\n\n${articleData.faq_items.map((f) => {
      const q = lang === "th" ? f.question_th : f.question_en;
      const a = lang === "th" ? f.answer_th : f.answer_en;
      return `**${q}**\n${a}`;
    }).join("\n\n")}`);
  }

  if (articleData.related_topics?.length) {
    parts.push(`## ${lang === "th" ? "บทความที่เกี่ยวข้อง" : "Related Articles"}\n\n${articleData.related_topics.map((r) => {
      const title = t(r.title_th, r.title_en);
      const desc = t(r.description_th, r.description_en);
      const slug = r.suggested_slug;
      return slug ? `→ [${title}](/blog/${slug}) — ${desc}` : `→ **${title}** — ${desc}`;
    }).join("\n")}`);
  }

  return parts.filter(Boolean).join("\n\n---\n\n");
}

const BulkCanvasGenerator = () => {
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

  const { data: existingArticles } = useQuery({
    queryKey: ["published-articles-for-linking"],
    queryFn: async () => {
      const { data } = await blogTable()
        .select("title_th, title_en, slug")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const getExistingArticlesContext = useCallback(() => {
    if (!existingArticles?.length) return undefined;
    return existingArticles.map((a: any) => `- "${a.title_th || a.title_en}" → /blog/${a.slug}`).join("\n");
  }, [existingArticles]);

  const getKnowledgeContext = useCallback(async () => {
    const { data } = await (supabase.from("knowledge_documents") as any)
      .select("title, extracted_text, tags")
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(10);
    if (!data?.length) return undefined;
    return data.map((d: any) => `### ${d.title}\n${(d.extracted_text || "").slice(0, 3000)}`).join("\n\n---\n\n");
  }, []);

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
    if (!aiInstruction.trim()) return;
    setIsGeneratingPrompts(true);
    try {
      const resp = await fetch(AUTOFILL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: `สร้าง ${count} หัวข้อบทความที่แตกต่างกัน จากคำสั่ง: "${aiInstruction}" ตอบเป็น JSON array ของ string เท่านั้น เช่น ["หัวข้อ 1", "หัวข้อ 2"] ห้ามซ้ำ ต้องมี keyword เกี่ยวกับ Clarity Laser Clinic ราชเทวี พญาไท สยาม`,
          mode: "bulk_topics",
          count,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.topics) {
        setPrompts(prev => prev.map((_, i) => data.topics[i] || ""));
        toast({ title: `สร้าง ${Math.min(data.topics.length, count)} หัวข้อสำเร็จ` });
      } else if (resp.ok && data.topic) {
        // fallback: autofill returned single topic, use as first
        setPrompts(prev => prev.map((p, i) => i === 0 ? data.topic : p));
      }
    } catch (err: any) {
      toast({ title: "สร้างหัวข้อไม่สำเร็จ", description: err.message, variant: "destructive" });
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const patchJob = useCallback((i: number, patch: Partial<ArticleJob>) => {
    setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, ...patch } : j)));
  }, []);

  const completedCount = jobs.filter((j) => j.step === "done" || j.step === "published").length;
  const errorCount = jobs.filter((j) => j.step === "error").length;
  const totalProgress = jobs.length > 0 ? jobs.reduce((sum, j) => sum + j.progress, 0) / jobs.length : 0;
  const draftCount = jobs.filter((j) => j.step === "done").length;

  const handleStop = useCallback(() => {
    abortRef.current = true;
    abortControllerRef.current?.abort();
    setIsRunning(false);
    setJobs((prev) => prev.map((j) =>
      j.step === "pending" || j.step === "generating" || j.step === "cover" || j.step === "saving"
        ? { ...j, step: "error", progress: 100, error: "ถูกยกเลิก" }
        : j
    ));
  }, []);

  const streamCanvasArticle = async (
    topic: string,
    onProgress: (pct: number) => void,
    abortSignal?: AbortSignal
  ): Promise<ArticleData> => {
    const knowledgeContext = await getKnowledgeContext();
    const resp = await withTimeout(
      fetch(CANVAS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          topic,
          brand: "Clarity Laser Clinic",
          author: "นพ.ฐิติคมน์ 61395, แพทย์ผู้เชี่ยวชาญด้านผิวหนังและเลเซอร์",
          audience: "",
          dataPoints: "",
          length: "medium",
          existingArticles: getExistingArticlesContext(),
          knowledgeContext,
        }),
        signal: abortSignal,
      }),
      180_000,
      "AI สร้างบทความ Canvas"
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
        onProgress(Math.min(28, 5 + chunkCount * 0.3));

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
    const article = tryParseArticleJson(fullText);
    if (!article) throw new Error("AI ไม่สามารถสร้างบทความ Canvas ได้");
    return article;
  };

  const handleGenerate = async () => {
    const validPrompts = prompts.filter((p) => p.trim());
    if (!validPrompts.length) {
      toast({ title: "กรุณากรอกหัวข้ออย่างน้อย 1 รายการ", variant: "destructive" });
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    abortRef.current = false;
    setIsRunning(true);
    setJobs(validPrompts.map((p) => ({ prompt: p, step: "pending" as ArticleStep, progress: 0 })));

    const { data: { user } } = await supabase.auth.getUser();
    const CONCURRENCY = 2;

    const processOne = async (i: number) => {
      if (abortRef.current) { patchJob(i, { step: "error", progress: 100, error: "ถูกยกเลิก" }); return; }

      patchJob(i, { step: "generating", progress: 5 });
      try {
        const articleData = await streamCanvasArticle(validPrompts[i], (pct) => patchJob(i, { progress: pct }), controller.signal);
        patchJob(i, { title: articleData.title_th || articleData.title_en || `บทความ ${i + 1}`, progress: 30 });
        if (abortRef.current) throw new Error("ถูกยกเลิก");

        // Cover
        patchJob(i, { step: "cover", progress: 35 });
        let coverUrl = "";
        try {
          coverUrl = await withTimeout(
            fetch(COVER_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
              body: JSON.stringify({ title: articleData.title_th || "", excerpt: articleData.excerpt_th, tags: articleData.tags?.join(", ") }),
            }).then(r => r.json()).then(d => d.url || ""),
            90_000,
            "สร้างรูปปก"
          );
        } catch { /* ignore */ }
        patchJob(i, { progress: 60, coverUrl: coverUrl || undefined });
        if (abortRef.current) throw new Error("ถูกยกเลิก");

        // Save
        patchJob(i, { step: "saving", progress: 70 });
        const baseSlug = articleData.slug || articleData.title_en?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `article-${Date.now()}`;
        const slug = `${baseSlug}-${Date.now().toString(36)}`;

        const payload = {
          slug,
          status: "draft",
          title_th: articleData.title_th || validPrompts[i],
          title_en: articleData.title_en || null,
          content_th: buildContent(articleData, "th"),
          content_en: buildContent(articleData, "en"),
          excerpt_th: articleData.excerpt_th || null,
          excerpt_en: articleData.excerpt_en || null,
          cover_image_url: coverUrl || null,
          tags: articleData.tags || [],
          meta_title_th: articleData.meta_title_th || null,
          meta_title_en: articleData.meta_title_en || null,
          meta_description_th: articleData.meta_description_th || null,
          meta_description_en: articleData.meta_description_en || null,
          created_by: user?.id,
        };

        const { data: inserted, error } = await blogTable().insert(payload).select("id, slug").single();
        if (error) throw new Error(error.message);

        // Save related topics to backlog
        if (articleData.related_topics?.length) {
          const topicsToSave = articleData.related_topics.map((r) => ({
            title_th: r.title_th,
            title_en: r.title_en || null,
            description_th: r.description_th || null,
            description_en: r.description_en || null,
            suggested_slug: r.suggested_slug || null,
            source_article_title: articleData.title_th || validPrompts[i],
            source_article_id: inserted?.id || null,
            status: "pending",
            created_by: user?.id || null,
          }));
          await (supabase.from("content_topic_backlog") as any).insert(topicsToSave);
        }

        patchJob(i, { step: "done", progress: 100, articleId: inserted?.id, slug: inserted?.slug || slug });
      } catch (err: any) {
        patchJob(i, { step: "error", progress: 100, error: err.message });
      }
    };

    for (let start = 0; start < validPrompts.length; start += CONCURRENCY) {
      if (abortRef.current) break;
      const batch = Array.from({ length: Math.min(CONCURRENCY, validPrompts.length - start) }, (_, k) => start + k);
      await Promise.all(batch.map(processOne));
    }

    setIsRunning(false);
    abortControllerRef.current = null;
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    queryClient.invalidateQueries({ queryKey: ["content-topic-backlog"] });
    toast({ title: "สร้างบทความ Canvas เสร็จสิ้น" });
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
    const draftJobs = jobs.map((j, i) => ({ j, i })).filter(({ j }) => j.step === "done" && j.articleId);
    for (const { i } of draftJobs) await handlePublish(i);
    toast({ title: `เผยแพร่ ${draftJobs.length} บทความแล้ว` });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (isRunning && !v) handleStop(); setOpen(v); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5">
          <Zap className="w-3.5 h-3.5" />
          Bulk Canvas Create
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            Bulk Canvas — สร้างบทความ SEO 2 ภาษา จำนวนมาก
          </DialogTitle>
          <DialogDescription className="text-xs">
            ใช้ Content Canvas pipeline สร้างบทความ 2 ภาษา + FAQ + Internal Links + Knowledge Context พร้อมรูปปกอัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        {!isRunning && jobs.length === 0 && (
          <div className="space-y-5 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-xs">จำนวนบทความ: <strong>{count}</strong></Label>
              <Slider value={[count]} onValueChange={handleCountChange} min={2} max={50} step={1} className="w-full" />
              <div className="flex justify-between text-[10px] text-muted-foreground"><span>2</span><span>25</span><span>50</span></div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-primary" />
                AI สร้างหัวข้ออัตโนมัติ (ใช้ข้อมูลจากคลังความรู้)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder={`เช่น "บทความเกี่ยวกับเลเซอร์รักษาหลุมสิว" หรือ "skincare tips"`}
                  className="text-xs flex-1"
                  disabled={isGeneratingPrompts}
                />
                <Button variant="secondary" size="sm" className="text-xs gap-1.5 shrink-0" onClick={handleGeneratePrompts} disabled={isGeneratingPrompts || !aiInstruction.trim()}>
                  {isGeneratingPrompts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  {isGeneratingPrompts ? "กำลังสร้าง..." : `สร้าง ${count} หัวข้อ`}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">AI จะดึงข้อมูลจากคลังความรู้มาช่วยสร้างหัวข้อที่หลากหลาย</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">หัวข้อบทความ ({count} รายการ)</Label>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {prompts.map((p, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-[10px] text-muted-foreground mt-2.5 w-6 text-right shrink-0">{i + 1}.</span>
                    <Textarea
                      value={p}
                      onChange={(e) => setPrompt(i, e.target.value)}
                      placeholder="เช่น การรักษาหลุมสิวด้วยเลเซอร์ CO2"
                      rows={1}
                      className="text-xs resize-none flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-[10px] text-muted-foreground space-y-1">
              <p>🌐 <strong>ทุกบทความจะสร้าง 2 ภาษา</strong> (ไทย + อังกฤษ) ด้วย Content Canvas</p>
              <p>📚 ดึงข้อมูลจากคลังความรู้อ้างอิงอัตโนมัติ</p>
              <p>🔗 สอดแทรก Internal Links จากบทความที่เผยแพร่แล้ว</p>
              <p>📝 หัวข้อที่เกี่ยวข้องจะถูกบันทึกลง Topic Backlog อัตโนมัติ</p>
            </div>

            <Button onClick={handleGenerate} className="w-full gap-2" disabled={prompts.every((p) => !p.trim())}>
              <Sparkles className="w-4 h-4" />
              เริ่มสร้าง {prompts.filter((p) => p.trim()).length} บทความ Canvas
            </Button>
          </div>
        )}

        {(isRunning || jobs.length > 0) && (
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  ทั้งหมด {Math.round(totalProgress)}% — สำเร็จ {completedCount}/{jobs.length} | ผิดพลาด {errorCount}
                </span>
                {isRunning && (
                  <Button variant="destructive" size="sm" className="text-xs h-7" onClick={handleStop}>หยุด</Button>
                )}
              </div>
              <Progress value={totalProgress} className="h-2" />
            </div>

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
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center text-muted-foreground font-medium">{i + 1}</span>
                    {(job.step === "generating" || job.step === "cover" || job.step === "saving") && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
                    {job.step === "done" && <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />}
                    {job.step === "published" && <CheckCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                    {job.step === "error" && <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                    <p className="truncate font-medium flex-1 min-w-0">{job.title || job.prompt.slice(0, 60)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={job.progress} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{Math.round(job.progress)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{STEP_LABEL[job.step]}</span>
                    <div className="flex gap-1">
                      {(job.step === "done" || job.step === "published") && job.slug && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={() => window.open(`/blog/${job.slug}`, "_blank")}>
                          <Eye className="w-3 h-3" /> Preview
                        </Button>
                      )}
                      {job.step === "done" && job.articleId && (
                        <Button variant="default" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={() => handlePublish(i)}>
                          <Send className="w-3 h-3" /> เผยแพร่
                        </Button>
                      )}
                    </div>
                  </div>
                  {job.error && <p className="text-destructive text-[10px]">{job.error}</p>}
                </div>
              ))}
            </div>

            {!isRunning && (
              <div className="flex gap-2">
                {draftCount > 0 && (
                  <Button onClick={handlePublishAll} className="flex-1 text-xs gap-1.5">
                    <Send className="w-3.5 h-3.5" /> เผยแพร่ทั้งหมด ({draftCount})
                  </Button>
                )}
                <Button variant="outline" className="flex-1 text-xs" onClick={() => { setJobs([]); setPrompts(Array(count).fill("")); }}>
                  สร้างชุดใหม่
                </Button>
                <Button variant="secondary" className="text-xs" onClick={() => setOpen(false)}>ปิด</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkCanvasGenerator;
