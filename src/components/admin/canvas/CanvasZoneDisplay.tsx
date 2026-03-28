import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw, Eye, Code, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface CanvasData {
  zone1?: {
    entity_block?: string;
    numerical_proofs?: Array<{ stat: string; context: string }>;
    metadata?: {
      publication_date?: string;
      last_updated?: string;
      review_note?: string;
      freshness_signal?: string;
    };
  };
  zone2?: {
    tldr_summary?: string;
    answer_first_content?: string;
  };
  zone3?: {
    structured_content?: string;
    expert_quotes?: Array<{ quote: string; attribution: string }>;
  };
  zone4?: {
    faq_items?: Array<{ question: string; answer: string }>;
    related_topics?: Array<{ title: string; description: string; connection: string }>;
    key_takeaways?: string[];
    reading_time_minutes?: number;
    schema_jsonld?: string;
  };
  estimated_word_count?: number;
}

interface Props {
  data: CanvasData;
  onRegenerate: (zone: number) => void;
  regeneratingZone: number | null;
}

const ZONE_CONFIG = [
  { key: "zone1", label: "Zone 1: Identity & Data", icon: "🔵", color: "border-blue-500/30 bg-blue-500/5", badgeColor: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  { key: "zone2", label: "Zone 2: Core Hook", icon: "🟢", color: "border-green-500/30 bg-green-500/5", badgeColor: "bg-green-500/10 text-green-700 border-green-500/20" },
  { key: "zone3", label: "Zone 3: Structure", icon: "🟡", color: "border-amber-500/30 bg-amber-500/5", badgeColor: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  { key: "zone4", label: "Zone 4: Connectivity", icon: "🔴", color: "border-red-500/30 bg-red-500/5", badgeColor: "bg-red-500/10 text-red-700 border-red-500/20" },
];

function calculateZoneScore(data: CanvasData, zoneKey: string): number {
  if (!data) return 0;
  const checks: boolean[] = [];

  if (zoneKey === "zone1") {
    const z = data.zone1;
    checks.push(!!z?.entity_block);
    checks.push((z?.numerical_proofs?.length ?? 0) >= 3);
    checks.push(!!z?.metadata?.publication_date);
    checks.push(!!z?.metadata?.freshness_signal);
  } else if (zoneKey === "zone2") {
    const z = data.zone2;
    checks.push(!!z?.tldr_summary);
    checks.push(!!z?.answer_first_content && z.answer_first_content.length > 200);
  } else if (zoneKey === "zone3") {
    const z = data.zone3;
    checks.push(!!z?.structured_content && z.structured_content.length > 200);
    checks.push((z?.expert_quotes?.length ?? 0) >= 2);
  } else if (zoneKey === "zone4") {
    const z = data.zone4;
    checks.push((z?.faq_items?.length ?? 0) >= 5);
    checks.push((z?.related_topics?.length ?? 0) >= 5);
    checks.push((z?.key_takeaways?.length ?? 0) >= 3);
    checks.push(!!z?.schema_jsonld);
  }

  if (checks.length === 0) return 0;
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function getCanvasScore(data: CanvasData): number {
  const scores = ZONE_CONFIG.map((z) => calculateZoneScore(data, z.key));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function renderZoneContent(data: CanvasData, zoneKey: string): string {
  if (zoneKey === "zone1") {
    const z = data.zone1;
    if (!z) return "";
    let md = "";
    if (z.entity_block) md += `## เกี่ยวกับแบรนด์\n\n${z.entity_block}\n\n`;
    if (z.numerical_proofs?.length) {
      md += `## ข้อมูลเชิงตัวเลข\n\n`;
      z.numerical_proofs.forEach((p) => {
        md += `- **${p.stat}** — ${p.context}\n`;
      });
      md += "\n";
    }
    if (z.metadata) {
      md += `---\n📅 เผยแพร่: ${z.metadata.publication_date || "-"}\n`;
      md += `🔄 ${z.metadata.freshness_signal || ""}\n`;
      md += `✅ ${z.metadata.review_note || ""}\n`;
    }
    return md;
  }
  if (zoneKey === "zone2") {
    const z = data.zone2;
    if (!z) return "";
    let md = "";
    if (z.tldr_summary) md += `## TL;DR\n\n${z.tldr_summary}\n\n---\n\n`;
    if (z.answer_first_content) md += z.answer_first_content;
    return md;
  }
  if (zoneKey === "zone3") {
    const z = data.zone3;
    if (!z) return "";
    let md = "";
    if (z.structured_content) md += z.structured_content + "\n\n";
    if (z.expert_quotes?.length) {
      md += `## ความเห็นจากผู้เชี่ยวชาญ\n\n`;
      z.expert_quotes.forEach((q) => {
        md += `> "${q.quote}"\n> — *${q.attribution}*\n\n`;
      });
    }
    return md;
  }
  if (zoneKey === "zone4") {
    const z = data.zone4;
    if (!z) return "";
    let md = "";
    if (z.reading_time_minutes) md += `⏱️ เวลาอ่านประมาณ ${z.reading_time_minutes} นาที\n\n`;
    if (z.faq_items?.length) {
      md += `## คำถามที่พบบ่อย (FAQ)\n\n`;
      z.faq_items.forEach((f) => {
        md += `**${f.question}**\n${f.answer}\n\n`;
      });
    }
    if (z.related_topics?.length) {
      md += `## หัวข้อที่เกี่ยวข้อง\n\n`;
      z.related_topics.forEach((r) => {
        md += `→ **${r.title}** — ${r.description}\n  _${r.connection}_\n\n`;
      });
    }
    if (z.key_takeaways?.length) {
      md += `## สรุปสำคัญ\n\n`;
      z.key_takeaways.forEach((k) => {
        md += `✅ ${k}\n`;
      });
      md += "\n";
    }
    if (z.schema_jsonld) {
      md += `## Schema JSON-LD\n\n\`\`\`json\n${typeof z.schema_jsonld === "string" ? z.schema_jsonld : JSON.stringify(z.schema_jsonld, null, 2)}\n\`\`\`\n`;
    }
    return md;
  }
  return "";
}

function getAllMarkdown(data: CanvasData): string {
  return ZONE_CONFIG.map((z) => renderZoneContent(data, z.key)).filter(Boolean).join("\n\n---\n\n");
}

const CanvasZoneDisplay = ({ data, onRegenerate, regeneratingZone }: Props) => {
  const [previewMode, setPreviewMode] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const { toast } = useToast();
  const canvasScore = getCanvasScore(data);

  const handleCopy = (type: "markdown" | "html") => {
    const md = getAllMarkdown(data);
    if (type === "html") {
      // Simple markdown to html
      const html = md
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
        .replace(/\n\n/g, "</p><p>")
        .replace(/^/, "<p>")
        .replace(/$/, "</p>");
      navigator.clipboard.writeText(html);
    } else {
      navigator.clipboard.writeText(md);
    }
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
    toast({ title: `คัดลอก ${type === "html" ? "HTML" : "Markdown"} แล้ว` });
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Canvas Score:</span>
            <Badge variant="outline" className={cn(
              "text-sm font-bold",
              canvasScore >= 80 ? "border-green-500 text-green-700" :
              canvasScore >= 50 ? "border-amber-500 text-amber-700" :
              "border-red-500 text-red-700"
            )}>
              {canvasScore}%
            </Badge>
          </div>
          {data.estimated_word_count && (
            <span className="text-xs text-muted-foreground">~{data.estimated_word_count} คำ</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={previewMode ? "default" : "outline"}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <Code className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {previewMode ? "แก้ไข" : "Preview"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleCopy("markdown")}>
            {copiedType === "markdown" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            Markdown
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleCopy("html")}>
            {copiedType === "html" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            HTML
          </Button>
        </div>
      </div>

      {previewMode ? (
        <div className="prose prose-sm max-w-none bg-card rounded-xl border border-border p-6">
          <div dangerouslySetInnerHTML={{
            __html: getAllMarkdown(data)
              .replace(/^## (.+)$/gm, "<h2>$1</h2>")
              .replace(/^### (.+)$/gm, "<h3>$1</h3>")
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(/\*(.+?)\*/g, "<em>$1</em>")
              .replace(/^- (.+)$/gm, "<li>$1</li>")
              .replace(/^> "?(.+?)"?$/gm, "<blockquote>$1</blockquote>")
              .replace(/^✅ (.+)$/gm, "<p>✅ $1</p>")
              .replace(/^→ (.+)$/gm, "<p>→ $1</p>")
              .replace(/\n\n/g, "<br/><br/>")
          }} />
        </div>
      ) : (
        <Tabs defaultValue="zone1" className="space-y-4">
          <TabsList className="bg-muted/50 h-auto flex-wrap">
            {ZONE_CONFIG.map((zone) => {
              const score = calculateZoneScore(data, zone.key);
              return (
                <TabsTrigger key={zone.key} value={zone.key} className="text-xs gap-1.5 py-2">
                  <span>{zone.icon}</span>
                  <span className="hidden sm:inline">{zone.label}</span>
                  <span className="sm:hidden">{zone.key.replace("zone", "Z")}</span>
                  <Badge variant="outline" className={cn("ml-1 text-[10px] h-4 px-1", zone.badgeColor)}>
                    {score}%
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {ZONE_CONFIG.map((zone, idx) => (
            <TabsContent key={zone.key} value={zone.key}>
              <div className={cn("rounded-xl border p-5 space-y-4", zone.color)}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{zone.icon} {zone.label}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => onRegenerate(idx + 1)}
                    disabled={regeneratingZone === idx + 1}
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", regeneratingZone === idx + 1 && "animate-spin")} />
                    Regenerate
                  </Button>
                </div>

                <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-background/50 rounded-lg p-4 border border-border/50">
                  {renderZoneContent(data, zone.key) || <span className="text-muted-foreground italic">ยังไม่มีข้อมูลในโซนนี้</span>}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default CanvasZoneDisplay;
