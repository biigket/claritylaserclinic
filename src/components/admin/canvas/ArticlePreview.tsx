import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw, FileText, Code2, Loader2, Globe, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface ArticleData {
  title_th?: string;
  title_en?: string;
  slug?: string;
  reading_time?: string;
  author_bio_th?: string;
  author_bio_en?: string;
  last_updated?: string;
  reviewer?: string;
  tldr_bullets_th?: string[];
  tldr_bullets_en?: string[];
  body_sections?: Array<{
    id: string;
    heading_th: string;
    heading_en: string;
    content_th: string;
    content_en: string;
  }>;
  expert_quotes?: Array<{ quote_th: string; quote_en: string; attribution: string }>;
  key_takeaways_th?: string[];
  key_takeaways_en?: string[];
  faq_items?: Array<{ question_th: string; answer_th: string; question_en: string; answer_en: string }>;
  related_topics?: Array<{
    title_th: string;
    title_en: string;
    description_th: string;
    description_en: string;
    suggested_slug?: string;
  }>;
  schema_jsonld?: any;
  meta_title_th?: string;
  meta_title_en?: string;
  meta_description_th?: string;
  meta_description_en?: string;
  excerpt_th?: string;
  excerpt_en?: string;
  tags?: string[];
  geo_score_details?: Record<string, boolean>;
}

interface Props {
  data: ArticleData;
  onRegenerateSection: (sectionId: string) => void;
  regeneratingSection: string | null;
  coverImageUrl?: string;
  onGenerateRelated?: (topic: { title_th: string; title_en: string; slug: string }) => void;
  onDeleteRelated?: (index: number) => void;
}

function calcGeoScore(details?: Record<string, boolean>): number {
  if (!details) return 0;
  const total = Object.keys(details).length;
  const passed = Object.values(details).filter(Boolean).length;
  return total > 0 ? Math.round((passed / total) * 100) : 0;
}

function articleToMarkdown(data: ArticleData, lang: "th" | "en"): string {
  const parts: string[] = [];
  const t = (th?: string, en?: string) => lang === "th" ? (th || en || "") : (en || th || "");

  if (data.reading_time) parts.push(`*${data.reading_time}*\n`);
  const bio = t(data.author_bio_th, data.author_bio_en);
  if (bio) parts.push(`> ${bio}\n`);
  if (data.last_updated || data.reviewer) parts.push(`${data.last_updated || ""} | ${data.reviewer || ""}\n`);

  const title = t(data.title_th, data.title_en);
  if (title) parts.push(`# ${title}\n`);

  const bullets = lang === "th" ? data.tldr_bullets_th : data.tldr_bullets_en;
  if (bullets?.length) {
    parts.push(`## ${lang === "th" ? "สรุปสำคัญ (TL;DR)" : "TL;DR Summary"}\n`);
    bullets.forEach((b) => parts.push(`- ${b}`));
    parts.push("");
  }

  data.body_sections?.forEach((s) => {
    parts.push(`## ${t(s.heading_th, s.heading_en)}\n`);
    parts.push(t(s.content_th, s.content_en) + "\n");
  });

  data.expert_quotes?.forEach((q) => {
    parts.push(`> "${t(q.quote_th, q.quote_en)}"\n> — *${q.attribution}*\n`);
  });

  const takeaways = lang === "th" ? data.key_takeaways_th : data.key_takeaways_en;
  if (takeaways?.length) {
    parts.push(`## ${lang === "th" ? "สรุปสำคัญ" : "Key Takeaways"}\n`);
    takeaways.forEach((k) => parts.push(`- ${k}`));
    parts.push("");
  }

  if (data.faq_items?.length) {
    parts.push(`## ${lang === "th" ? "คำถามที่พบบ่อย (FAQ)" : "Frequently Asked Questions"}\n`);
    data.faq_items.forEach((f) => {
      const q = lang === "th" ? f.question_th : f.question_en;
      const a = lang === "th" ? f.answer_th : f.answer_en;
      parts.push(`**${q}**\n${a}\n`);
    });
  }

  if (data.related_topics?.length) {
    parts.push(`## ${lang === "th" ? "บทความที่เกี่ยวข้อง" : "Related Articles"}\n`);
    data.related_topics.forEach((r) => {
      const title = t(r.title_th, r.title_en);
      const desc = t(r.description_th, r.description_en);
      parts.push(`→ **${title}** — ${desc}`);
    });
    parts.push("");
  }

  return parts.join("\n");
}

const ArticlePreview = ({ data, onRegenerateSection, regeneratingSection, coverImageUrl, onGenerateRelated, onDeleteRelated }: Props) => {
  const { toast } = useToast();
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [previewLang, setPreviewLang] = useState<"th" | "en">("th");

  const geoScore = calcGeoScore(data.geo_score_details);
  const t = (th?: string, en?: string) => previewLang === "th" ? (th || en || "") : (en || th || "");

  const handleCopy = (type: "markdown" | "html") => {
    const md = articleToMarkdown(data, previewLang);
    if (type === "html") {
      const html = md
        .replace(/^# (.+)$/gm, "<h1>$1</h1>")
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
        .replace(/\n\n/g, "</p><p>");
      navigator.clipboard.writeText(html);
    } else {
      navigator.clipboard.writeText(md);
    }
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
    toast({ title: `คัดลอก ${type === "html" ? "HTML" : "Markdown"} (${previewLang.toUpperCase()}) แล้ว` });
  };

  const bullets = previewLang === "th" ? data.tldr_bullets_th : data.tldr_bullets_en;
  const takeaways = previewLang === "th" ? data.key_takeaways_th : data.key_takeaways_en;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border border-border rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn(
            "text-sm font-bold px-3 py-1",
            geoScore >= 80 ? "border-green-500/50 text-green-700 bg-green-500/5" :
            geoScore >= 50 ? "border-amber-500/50 text-amber-700 bg-amber-500/5" :
            "border-red-500/50 text-red-700 bg-red-500/5"
          )}>
            GEO: {geoScore}%
          </Badge>
          {data.reading_time && (
            <span className="text-xs text-muted-foreground">{data.reading_time}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setPreviewLang("th")}
              className={cn("px-2.5 py-1 text-xs transition-colors", previewLang === "th" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              🇹🇭 TH
            </button>
            <button
              onClick={() => setPreviewLang("en")}
              className={cn("px-2.5 py-1 text-xs transition-colors", previewLang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              🇬🇧 EN
            </button>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleCopy("markdown")}>
            {copiedType === "markdown" ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            MD
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleCopy("html")}>
            {copiedType === "html" ? <Check className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
            HTML
          </Button>
        </div>
      </div>

      {/* Article */}
      <article className="bg-card border border-border rounded-xl overflow-hidden">
        {coverImageUrl && (
          <div className="w-full aspect-[16/7] overflow-hidden">
            <img src={coverImageUrl} alt={t(data.title_th, data.title_en)} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="max-w-2xl mx-auto px-6 py-8 md:px-10 md:py-12 space-y-6" style={{ fontFamily: "'Georgia', 'Sarabun', serif" }}>
          {(data.last_updated || data.reviewer) && (
            <p className="text-xs text-muted-foreground">
              {data.last_updated} {data.reviewer && `| ${data.reviewer}`}
            </p>
          )}

          {t(data.author_bio_th, data.author_bio_en) && (
            <div className="border-l-4 border-primary/30 pl-4 py-2 bg-primary/5 rounded-r-lg text-sm text-muted-foreground italic">
              {t(data.author_bio_th, data.author_bio_en)}
            </div>
          )}

          {t(data.title_th, data.title_en) && (
            <h1 className="text-2xl md:text-3xl font-bold leading-tight text-foreground">
              {t(data.title_th, data.title_en)}
            </h1>
          )}

          {/* TL;DR */}
          {bullets?.length ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-2">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                {previewLang === "th" ? "สรุปสั้นๆ" : "Quick Summary"}
              </p>
              <ul className="space-y-1.5">
                {bullets.map((b, i) => (
                  <li key={i} className="text-sm leading-relaxed flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span dangerouslySetInnerHTML={{ __html: b.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Body */}
          {data.body_sections?.map((section) => (
            <div
              key={section.id}
              className="relative group"
              onMouseEnter={() => setHoveredSection(section.id)}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <h2 className="text-lg md:text-xl font-semibold text-foreground mt-8 mb-3">
                {t(section.heading_th, section.heading_en)}
              </h2>
              <div
                className="text-sm leading-relaxed text-foreground/90 space-y-3"
                dangerouslySetInnerHTML={{
                  __html: t(section.content_th, section.content_en)
                    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.+?)\*/g, "<em>$1</em>")
                    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline underline-offset-2 hover:text-primary/80">$1</a>')
                    .replace(/\n\n/g, "</p><p class='mt-3'>")
                    .replace(/^(\d+)\. (.+)$/gm, '<span class="block ml-4">$1. $2</span>')
                    .replace(/^- (.+)$/gm, '<span class="block ml-4">• $1</span>')
                }}
              />
              {hoveredSection === section.id && (
                <Button
                  variant="outline" size="sm"
                  className="absolute -top-2 right-0 gap-1 text-[10px] h-6 opacity-80 hover:opacity-100 bg-background"
                  onClick={() => onRegenerateSection(section.id)}
                  disabled={regeneratingSection === section.id}
                >
                  {regeneratingSection === section.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Regenerate
                </Button>
              )}
            </div>
          ))}

          {/* Expert Quotes */}
          {data.expert_quotes?.map((q, i) => (
            <blockquote key={i} className="border-l-4 border-primary/40 pl-4 py-3 my-6 bg-muted/30 rounded-r-lg">
              <p className="text-sm italic text-foreground/80">"{t(q.quote_th, q.quote_en)}"</p>
              <cite className="text-xs text-muted-foreground not-italic">— {q.attribution}</cite>
            </blockquote>
          ))}

          {/* Key Takeaways */}
          {takeaways?.length ? (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5 space-y-2 mt-8">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                {previewLang === "th" ? "สรุปสำคัญ" : "Key Takeaways"}
              </p>
              <ul className="space-y-1.5">
                {takeaways.map((k, i) => (
                  <li key={i} className="text-sm flex gap-2"><span>✅</span><span>{k}</span></li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* FAQ */}
          {data.faq_items?.length ? (
            <div className="mt-8 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                {previewLang === "th" ? "คำถามที่พบบ่อย (FAQ)" : "Frequently Asked Questions"}
              </h2>
              {data.faq_items.map((f, i) => (
                <div key={i} className="border border-border rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {previewLang === "th" ? f.question_th : f.question_en}
                  </p>
                  <p className="text-sm text-foreground/80">
                    {previewLang === "th" ? f.answer_th : f.answer_en}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Related Topics — with "Generate" button */}
          {data.related_topics?.length ? (
            <div className="mt-8 space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                {previewLang === "th" ? "บทความที่เกี่ยวข้อง" : "Related Articles"}
              </h2>
              {data.related_topics.map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-3 border border-border rounded-lg p-3 hover:border-primary/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      → {t(r.title_th, r.title_en)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(r.description_th, r.description_en)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onGenerateRelated && (
                      <Button
                        variant="outline" size="sm"
                        className="gap-1 text-[10px] h-7 border-primary/30 text-primary hover:bg-primary/5"
                        onClick={() => onGenerateRelated({
                          title_th: r.title_th,
                          title_en: r.title_en,
                          slug: r.suggested_slug || "",
                        })}
                      >
                        <Globe className="w-3 h-3" />
                        เขียนบทความนี้
                      </Button>
                    )}
                    {onDeleteRelated && (
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDeleteRelated(i)}
                        title="ลบหัวข้อนี้"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Schema */}
          {data.schema_jsonld && (
            <div className="mt-8 border-t border-border pt-4">
              <button onClick={() => setShowSchema(!showSchema)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {showSchema ? "▼" : "▶"} Schema JSON-LD
              </button>
              {showSchema && (
                <pre className="mt-2 text-[10px] bg-muted rounded-lg p-4 overflow-auto max-h-60">
                  {JSON.stringify(data.schema_jsonld, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
};

export { articleToMarkdown };
export default ArticlePreview;
