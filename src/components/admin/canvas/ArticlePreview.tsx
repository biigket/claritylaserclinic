import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw, FileText, Code2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface ArticleData {
  title?: string;
  slug?: string;
  reading_time?: string;
  author_bio?: string;
  last_updated?: string;
  reviewer?: string;
  tldr_bullets?: string[];
  body_sections?: Array<{ id: string; heading: string; content: string }>;
  expert_quotes?: Array<{ quote: string; attribution: string }>;
  key_takeaways?: string[];
  faq_items?: Array<{ question: string; answer: string }>;
  related_topics?: Array<{ title: string; description: string }>;
  schema_jsonld?: any;
  meta_title?: string;
  meta_description?: string;
  excerpt?: string;
  tags?: string[];
  geo_score_details?: Record<string, boolean>;
}

interface Props {
  data: ArticleData;
  onRegenerateSection: (sectionId: string) => void;
  regeneratingSection: string | null;
  coverImageUrl?: string;
}

function calcGeoScore(details?: Record<string, boolean>): number {
  if (!details) return 0;
  const total = Object.keys(details).length;
  const passed = Object.values(details).filter(Boolean).length;
  return total > 0 ? Math.round((passed / total) * 100) : 0;
}

function articleToMarkdown(data: ArticleData): string {
  const parts: string[] = [];

  if (data.reading_time) parts.push(`*${data.reading_time}*\n`);
  if (data.author_bio) parts.push(`> ${data.author_bio}\n`);
  if (data.last_updated || data.reviewer) {
    parts.push(`${data.last_updated || ""} | ${data.reviewer || ""}\n`);
  }
  if (data.title) parts.push(`# ${data.title}\n`);

  if (data.tldr_bullets?.length) {
    parts.push(`## สรุปสำคัญ (TL;DR)\n`);
    data.tldr_bullets.forEach((b) => parts.push(`- ${b}`));
    parts.push("");
  }

  data.body_sections?.forEach((s) => {
    parts.push(`## ${s.heading}\n`);
    parts.push(s.content + "\n");
  });

  if (data.expert_quotes?.length) {
    data.expert_quotes.forEach((q) => {
      parts.push(`> "${q.quote}"\n> — *${q.attribution}*\n`);
    });
  }

  if (data.key_takeaways?.length) {
    parts.push(`## สรุปสำคัญ (Key Takeaways)\n`);
    data.key_takeaways.forEach((k) => parts.push(`- ${k}`));
    parts.push("");
  }

  if (data.faq_items?.length) {
    parts.push(`## คำถามที่พบบ่อย (FAQ)\n`);
    data.faq_items.forEach((f) => {
      parts.push(`**${f.question}**\n${f.answer}\n`);
    });
  }

  if (data.related_topics?.length) {
    parts.push(`## บทความที่เกี่ยวข้อง\n`);
    data.related_topics.forEach((r) => {
      parts.push(`→ **${r.title}** — ${r.description}`);
    });
    parts.push("");
  }

  return parts.join("\n");
}

function simpleMarkdownToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mt-6 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">$1</blockquote>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<)/, "<p>")
    .replace(/(?!>)$/, "</p>");
}

const ArticlePreview = ({ data, onRegenerateSection, regeneratingSection, coverImageUrl }: Props) => {
  const { toast } = useToast();
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const geoScore = calcGeoScore(data.geo_score_details);

  const handleCopy = (type: "markdown" | "html") => {
    const md = articleToMarkdown(data);
    navigator.clipboard.writeText(type === "html" ? simpleMarkdownToHtml(md) : md);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
    toast({ title: `คัดลอก ${type === "html" ? "HTML" : "Markdown"} แล้ว` });
  };

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
            GEO Score: {geoScore}%
          </Badge>
          {data.reading_time && (
            <span className="text-xs text-muted-foreground">{data.reading_time}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleCopy("markdown")}>
            {copiedType === "markdown" ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            Markdown
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleCopy("html")}>
            {copiedType === "html" ? <Check className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
            HTML
          </Button>
        </div>
      </div>

      {/* Article */}
      <article className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Cover Image */}
        {coverImageUrl && (
          <div className="w-full aspect-[16/7] overflow-hidden">
            <img src={coverImageUrl} alt={data.title || ""} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="max-w-2xl mx-auto px-6 py-8 md:px-10 md:py-12 space-y-6" style={{ fontFamily: "'Georgia', 'Sarabun', serif" }}>
          {/* Meta */}
          {(data.last_updated || data.reviewer) && (
            <p className="text-xs text-muted-foreground">
              {data.last_updated} {data.reviewer && `| ${data.reviewer}`}
            </p>
          )}

          {/* Author Bio */}
          {data.author_bio && (
            <div className="border-l-4 border-primary/30 pl-4 py-2 bg-primary/5 rounded-r-lg text-sm text-muted-foreground italic">
              {data.author_bio}
            </div>
          )}

          {/* Title */}
          {data.title && (
            <h1 className="text-2xl md:text-3xl font-bold leading-tight text-foreground">{data.title}</h1>
          )}

          {/* TL;DR */}
          {data.tldr_bullets?.length ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-2">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">TL;DR — สรุปสำคัญ</p>
              <ul className="space-y-1.5">
                {data.tldr_bullets.map((b, i) => (
                  <li key={i} className="text-sm leading-relaxed flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span dangerouslySetInnerHTML={{ __html: b.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Body Sections */}
          {data.body_sections?.map((section) => (
            <div
              key={section.id}
              className="relative group"
              onMouseEnter={() => setHoveredSection(section.id)}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <h2 className="text-lg md:text-xl font-semibold text-foreground mt-8 mb-3">{section.heading}</h2>
              <div
                className="text-sm leading-relaxed text-foreground/90 space-y-3 prose-sm"
                dangerouslySetInnerHTML={{
                  __html: section.content
                    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.+?)\*/g, "<em>$1</em>")
                    .replace(/\n\n/g, "</p><p class='mt-3'>")
                    .replace(/^\|(.+)\|$/gm, (match) => {
                      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
                      return `<span class="block text-xs bg-muted rounded px-2 py-1 my-1">${cells.join(" | ")}</span>`;
                    })
                    .replace(/^(\d+)\. (.+)$/gm, '<span class="block ml-4">$1. $2</span>')
                    .replace(/^- (.+)$/gm, '<span class="block ml-4">• $1</span>')
                }}
              />
              {/* Regenerate button on hover */}
              {hoveredSection === section.id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute -top-2 right-0 gap-1 text-[10px] h-6 opacity-80 hover:opacity-100 bg-background"
                  onClick={() => onRegenerateSection(section.id)}
                  disabled={regeneratingSection === section.id}
                >
                  {regeneratingSection === section.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Regenerate
                </Button>
              )}
            </div>
          ))}

          {/* Expert Quotes */}
          {data.expert_quotes?.map((q, i) => (
            <blockquote key={i} className="border-l-4 border-primary/40 pl-4 py-3 my-6 bg-muted/30 rounded-r-lg">
              <p className="text-sm italic text-foreground/80">"{q.quote}"</p>
              <cite className="text-xs text-muted-foreground not-italic">— {q.attribution}</cite>
            </blockquote>
          ))}

          {/* Key Takeaways */}
          {data.key_takeaways?.length ? (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5 space-y-2 mt-8">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">สรุปสำคัญ — Key Takeaways</p>
              <ul className="space-y-1.5">
                {data.key_takeaways.map((k, i) => (
                  <li key={i} className="text-sm flex gap-2"><span>✅</span><span>{k}</span></li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* FAQ */}
          {data.faq_items?.length ? (
            <div className="mt-8 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">คำถามที่พบบ่อย (FAQ)</h2>
              {data.faq_items.map((f, i) => (
                <div key={i} className="border border-border rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-1">{f.question}</p>
                  <p className="text-sm text-foreground/80">{f.answer}</p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Related Topics */}
          {data.related_topics?.length ? (
            <div className="mt-8 space-y-2">
              <h2 className="text-lg font-semibold text-foreground">บทความที่เกี่ยวข้อง</h2>
              {data.related_topics.map((r, i) => (
                <p key={i} className="text-sm text-foreground/80">
                  → <strong>{r.title}</strong> — {r.description}
                </p>
              ))}
            </div>
          ) : null}

          {/* Schema JSON-LD */}
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
