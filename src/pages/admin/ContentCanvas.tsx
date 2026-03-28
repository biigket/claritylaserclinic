import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Upload, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CanvasInputForm, { type CanvasInput } from "@/components/admin/canvas/CanvasInputForm";
import ArticlePreview, { type ArticleData } from "@/components/admin/canvas/ArticlePreview";

const CANVAS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-canvas-generate`;
const COVER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-generate-cover`;

const LOADING_MESSAGES = [
  "กำลังวิเคราะห์คำค้นหา...",
  "กำลังจัดโครงสร้างบทความ...",
  "กำลังเพิ่มข้อมูลเชิงลึก...",
  "กำลังสร้าง FAQ...",
  "กำลังเพิ่ม Schema markup...",
  "เกือบเสร็จแล้ว...",
];

function tryParseArticleJson(text: string): ArticleData | null {
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.title || parsed.body_sections) return parsed;
  } catch {
    const match = cleaned.match(/\{[\s\S]*"body_sections"[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* */ }
    }
  }
  return null;
}

const ContentCanvas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [currentInput, setCurrentInput] = useState<CanvasInput | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const streamGenerate = useCallback(async (input: CanvasInput, sectionId?: string) => {
    if (sectionId) {
      setRegeneratingSection(sectionId);
    } else {
      setIsGenerating(true);
      setProgress(0);
      setLoadingMsg(LOADING_MESSAGES[0]);
    }

    let fullText = "";

    try {
      const resp = await fetch(CANVAS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ ...input, sectionId }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let chunkCount = 0;

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
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              chunkCount++;
              if (!sectionId) {
                const p = Math.min(95, Math.round(chunkCount * 0.4));
                setProgress(p);
                const msgIdx = Math.min(Math.floor(p / 18), LOADING_MESSAGES.length - 1);
                setLoadingMsg(LOADING_MESSAGES[msgIdx]);
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      const parsed = tryParseArticleJson(fullText);
      if (parsed) {
        if (sectionId && parsed.heading && parsed.content) {
          // Replace specific section
          setArticleData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              body_sections: prev.body_sections?.map((s) =>
                s.id === sectionId ? { ...s, heading: parsed.heading || s.heading, content: parsed.content || s.content } : s
              ),
            };
          });
        } else {
          setArticleData(parsed);
          // Auto-generate cover
          generateCover(parsed.title || input.topic, parsed.excerpt, parsed.tags);
        }
        if (!sectionId) setProgress(100);
        toast({ title: sectionId ? "Section regenerated ✨" : "สร้างบทความเสร็จแล้ว ✨" });
      } else {
        toast({ title: "ไม่สามารถ parse ผลลัพธ์ได้", description: "กรุณาลองใหม่", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setRegeneratingSection(null);
    }
  }, [toast]);

  const generateCover = async (title: string, excerpt?: string, tags?: string[]) => {
    setGeneratingCover(true);
    try {
      const resp = await fetch(COVER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ title, excerpt, tags: tags?.join(", ") }),
      });
      const data = await resp.json();
      if (resp.ok && data.url) {
        setCoverImageUrl(data.url);
      }
    } catch (e) {
      console.warn("Cover generation failed:", e);
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleGenerate = (input: CanvasInput) => {
    setCurrentInput(input);
    setCoverImageUrl(null);
    streamGenerate(input);
  };

  const handleRegenerateSection = (sectionId: string) => {
    if (currentInput) streamGenerate(currentInput, sectionId);
  };

  const handlePublish = async () => {
    if (!articleData || !currentInput) return;
    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Build full markdown content
      const bodyMd = articleData.body_sections
        ?.map((s) => `## ${s.heading}\n\n${s.content}`)
        .join("\n\n") || "";

      const quotesMd = articleData.expert_quotes
        ?.map((q) => `> "${q.quote}"\n> — *${q.attribution}*`)
        .join("\n\n") || "";

      const takeawaysMd = articleData.key_takeaways?.length
        ? `## สรุปสำคัญ\n\n${articleData.key_takeaways.map((k) => `- ${k}`).join("\n")}`
        : "";

      const faqMd = articleData.faq_items?.length
        ? `## คำถามที่พบบ่อย\n\n${articleData.faq_items.map((f) => `**${f.question}**\n${f.answer}`).join("\n\n")}`
        : "";

      const relatedMd = articleData.related_topics?.length
        ? `## บทความที่เกี่ยวข้อง\n\n${articleData.related_topics.map((r) => `→ **${r.title}** — ${r.description}`).join("\n")}`
        : "";

      const tldrMd = articleData.tldr_bullets?.length
        ? articleData.tldr_bullets.map((b) => `- ${b}`).join("\n")
        : "";

      const fullContent = [
        tldrMd && `> **TL;DR**\n${tldrMd}`,
        articleData.author_bio && `*${articleData.author_bio}*`,
        bodyMd,
        quotesMd,
        takeawaysMd,
        faqMd,
        relatedMd,
      ].filter(Boolean).join("\n\n---\n\n");

      const slug = articleData.slug || articleData.title
        ?.toLowerCase()
        .replace(/[^a-z0-9ก-๙]+/gu, "-")
        .replace(/(^-|-$)/g, "") || `article-${Date.now()}`;

      const payload = {
        slug,
        status: "published" as const,
        title_th: articleData.title || currentInput.topic,
        content_th: fullContent,
        excerpt_th: articleData.excerpt || articleData.tldr_bullets?.[0] || null,
        cover_image_url: coverImageUrl || null,
        tags: articleData.tags || [],
        meta_title_th: articleData.meta_title || null,
        meta_description_th: articleData.meta_description || null,
        published_at: new Date().toISOString(),
        created_by: user?.id,
      };

      const { data, error } = await (supabase.from("blog_articles") as any)
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      toast({ title: "เผยแพร่บทความสำเร็จ ✨" });
      navigate(`/admin/blogs/${data.id}`);
    } catch (e: any) {
      toast({ title: "เผยแพร่ล้มเหลว", description: e.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/blogs")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display text-xl text-foreground">AI Content Generator</h1>
            <p className="text-[10px] text-muted-foreground">สร้างบทความ SEO สำหรับ AI Search Engines</p>
          </div>
        </div>

        {articleData && (
          <div className="flex gap-2">
            {generatingCover && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 self-center">
                <Loader2 className="w-3 h-3 animate-spin" /> กำลังสร้างรูปปก...
              </span>
            )}
            {isAdmin && (
              <Button onClick={handlePublish} disabled={publishing} className="gap-1.5 text-xs" size="sm">
                {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {publishing ? "กำลังเผยแพร่..." : "เผยแพร่เป็นบทความ"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Input Form (show when no article yet or allow editing) */}
      {!articleData && !isGenerating && (
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <CanvasInputForm onGenerate={handleGenerate} isGenerating={isGenerating} />
        </div>
      )}

      {/* Loading */}
      {isGenerating && (
        <div className="bg-card rounded-xl border border-border p-8 mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-foreground">{loadingMsg}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-[10px] text-muted-foreground text-center">{progress}% complete</p>
        </div>
      )}

      {/* Article Output */}
      {articleData && !isGenerating && (
        <>
          {/* Toolbar to go back to form */}
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => { setArticleData(null); setCoverImageUrl(null); }}>
              <ArrowLeft className="w-3.5 h-3.5" /> แก้ไข Input & สร้างใหม่
            </Button>
            {articleData.slug && (
              <Button variant="ghost" size="sm" className="text-xs gap-1.5" asChild>
                <a href={`/blog/${articleData.slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </a>
              </Button>
            )}
          </div>

          <ArticlePreview
            data={articleData}
            onRegenerateSection={handleRegenerateSection}
            regeneratingSection={regeneratingSection}
            coverImageUrl={coverImageUrl || undefined}
          />
        </>
      )}
    </div>
  );
};

export default ContentCanvas;
