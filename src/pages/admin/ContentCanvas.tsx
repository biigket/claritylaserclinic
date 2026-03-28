import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Upload, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import CanvasInputForm, { type CanvasInput } from "@/components/admin/canvas/CanvasInputForm";
import ArticlePreview, { type ArticleData, articleToMarkdown } from "@/components/admin/canvas/ArticlePreview";

const CANVAS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-canvas-generate`;
const COVER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-generate-cover`;

const LOADING_MESSAGES = [
  "กำลังวิเคราะห์คำค้นหา...",
  "กำลังจัดโครงสร้างบทความ (TH + EN)...",
  "กำลังเพิ่มข้อมูลเชิงลึก...",
  "กำลังสร้าง FAQ 2 ภาษา...",
  "กำลังสอดแทรก Local SEO...",
  "กำลังเพิ่ม Schema markup...",
  "เกือบเสร็จแล้ว...",
];

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
  const [publishedArticles, setPublishedArticles] = useState<Array<{ title: string; slug: string }>>([]);

  // Fetch existing articles for internal linking
  const { data: existingArticles } = useQuery({
    queryKey: ["published-articles-for-linking"],
    queryFn: async () => {
      const { data } = await (supabase.from("blog_articles") as any)
        .select("title_th, title_en, slug")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const getExistingArticlesContext = useCallback(() => {
    const articles = [...(existingArticles || []), ...publishedArticles];
    if (!articles.length) return undefined;
    return articles
      .map((a: any) => `- "${a.title_th || a.title || a.title_en}" → /blog/${a.slug}`)
      .join("\n");
  }, [existingArticles, publishedArticles]);

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
        body: JSON.stringify({
          ...input,
          sectionId,
          existingArticles: getExistingArticlesContext(),
        }),
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
                const p = Math.min(95, Math.round(chunkCount * 0.3));
                setProgress(p);
                const msgIdx = Math.min(Math.floor(p / 15), LOADING_MESSAGES.length - 1);
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
        if (sectionId) {
          const sd = parsed as any;
          setArticleData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              body_sections: prev.body_sections?.map((s) =>
                s.id === sectionId
                  ? { ...s, heading_th: sd.heading_th || s.heading_th, heading_en: sd.heading_en || s.heading_en, content_th: sd.content_th || s.content_th, content_en: sd.content_en || s.content_en }
                  : s
              ),
            };
          });
        } else {
          setArticleData(parsed);
          generateCover(parsed.title_th || parsed.title_en || input.topic, parsed.excerpt_th || parsed.excerpt_en, parsed.tags);
        }
        if (!sectionId) setProgress(100);
        toast({ title: sectionId ? "Section regenerated ✨" : "สร้างบทความ 2 ภาษาเสร็จแล้ว ✨" });
      } else {
        toast({ title: "ไม่สามารถ parse ผลลัพธ์ได้", description: "กรุณาลองใหม่", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setRegeneratingSection(null);
    }
  }, [toast, getExistingArticlesContext]);

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
      if (resp.ok && data.url) setCoverImageUrl(data.url);
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

      const buildContent = (lang: "th" | "en") => {
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
      };

      const slug = articleData.slug || articleData.title_en
        ?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `article-${Date.now()}`;

      const payload = {
        slug,
        status: "published" as const,
        title_th: articleData.title_th || currentInput.topic,
        title_en: articleData.title_en || null,
        content_th: buildContent("th"),
        content_en: buildContent("en"),
        excerpt_th: articleData.excerpt_th || null,
        excerpt_en: articleData.excerpt_en || null,
        cover_image_url: coverImageUrl || null,
        tags: articleData.tags || [],
        meta_title_th: articleData.meta_title_th || null,
        meta_title_en: articleData.meta_title_en || null,
        meta_description_th: articleData.meta_description_th || null,
        meta_description_en: articleData.meta_description_en || null,
        published_at: new Date().toISOString(),
        created_by: user?.id,
      };

      const { data, error } = await (supabase.from("blog_articles") as any)
        .insert(payload).select("id").single();

      if (error) throw error;

      // Track published article for internal linking
      setPublishedArticles((prev) => [...prev, { title: articleData.title_th || "", slug }]);

      toast({ title: "เผยแพร่บทความ 2 ภาษาสำเร็จ ✨" });
      navigate(`/admin/blogs/${data.id}`);
    } catch (e: any) {
      toast({ title: "เผยแพร่ล้มเหลว", description: e.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  // Generate related article
  const handleGenerateRelated = (topic: { title_th: string; title_en: string; slug: string }) => {
    const newInput: CanvasInput = {
      topic: topic.title_th || topic.title_en,
      brand: currentInput?.brand || "Clarity Laser Clinic",
      author: currentInput?.author || "",
      audience: currentInput?.audience || "",
      dataPoints: "",
      language: "Both",
      length: currentInput?.length || "medium",
    };
    setCurrentInput(newInput);
    setArticleData(null);
    setCoverImageUrl(null);
    streamGenerate(newInput);
    toast({ title: `กำลังสร้างบทความ: ${topic.title_th}` });
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
            <p className="text-[10px] text-muted-foreground">สร้างบทความ 2 ภาษา + Local SEO สำหรับ AI Search Engines</p>
          </div>
        </div>

        {articleData && (
          <div className="flex gap-2 items-center">
            {generatingCover && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> สร้างรูปปก...
              </span>
            )}
            {isAdmin && (
              <Button onClick={handlePublish} disabled={publishing} className="gap-1.5 text-xs" size="sm">
                {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {publishing ? "กำลังเผยแพร่..." : "เผยแพร่ (TH + EN)"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Input Form */}
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
          <p className="text-[10px] text-muted-foreground text-center">{progress}%</p>
        </div>
      )}

      {/* Article Output */}
      {articleData && !isGenerating && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => { setArticleData(null); setCoverImageUrl(null); }}>
              <ArrowLeft className="w-3.5 h-3.5" /> แก้ไข Input & สร้างใหม่
            </Button>
          </div>

          <ArticlePreview
            data={articleData}
            onRegenerateSection={handleRegenerateSection}
            regeneratingSection={regeneratingSection}
            coverImageUrl={coverImageUrl || undefined}
            onGenerateRelated={handleGenerateRelated}
          />
        </>
      )}
    </div>
  );
};

export default ContentCanvas;
