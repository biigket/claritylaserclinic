import { Check, X, AlertTriangle, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReviewSummaryProps {
  form: Record<string, any>;
  visualAssets: any[];
  expectedVisualCount?: number;
}

const ScorePill = ({ label, value }: { label: string; value: number | null | undefined }) => {
  const v = typeof value === "number" ? value : null;
  const tone =
    v === null
      ? "bg-muted text-muted-foreground border-border"
      : v >= 80
        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
        : v >= 60
          ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
          : "bg-destructive/10 text-destructive border-destructive/30";
  return (
    <div className={cn("rounded-lg border px-3 py-2 flex flex-col items-start", tone)}>
      <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="font-display text-lg leading-none mt-1">{v === null ? "—" : v}</div>
    </div>
  );
};

const Row = ({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) => (
  <div className="flex items-start gap-2 text-xs">
    <span
      className={cn(
        "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0",
        ok ? "bg-emerald-500/15 text-emerald-700" : "bg-destructive/10 text-destructive"
      )}
    >
      {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
    </span>
    <div className="min-w-0">
      <div className={cn("leading-tight", ok ? "text-foreground/80" : "text-foreground")}>{label}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  </div>
);

const hasMarkdownImage = (content: string | null | undefined) =>
  !!content && /!\[[^\]]*\]\([^)]+\)/.test(content);

const countTokens = (s: any) => (Array.isArray(s) ? s.length : 0);

export const ReviewSummary = ({ form, visualAssets, expectedVisualCount = 5 }: ReviewSummaryProps) => {
  const thFields = {
    title: form.title_th,
    content: form.content_th,
    meta_title: form.meta_title_th,
    meta_description: form.meta_description_th,
    excerpt: form.excerpt_th,
  };
  const enFields = {
    title: form.title_en,
    content: form.content_en,
    meta_title: form.meta_title_en,
    meta_description: form.meta_description_en,
    excerpt: form.excerpt_en,
  };
  const thMissing = Object.entries(thFields).filter(([, v]) => !String(v ?? "").trim()).map(([k]) => k);
  const enMissing = Object.entries(enFields).filter(([, v]) => !String(v ?? "").trim()).map(([k]) => k);
  const thComplete = thMissing.length === 0;
  const enComplete = enMissing.length === 0;

  const visualCount = visualAssets?.length ?? 0;
  const visualsUploaded = visualCount >= expectedVisualCount;
  const visualsInTh = hasMarkdownImage(form.content_th);
  const visualsInEn = hasMarkdownImage(form.content_en);

  const altCaptionComplete =
    visualCount > 0 &&
    visualAssets.every(
      (a: any) =>
        String(a.alt_text ?? "").trim() &&
        String(a.caption ?? "").trim() &&
        String(a.metadata?.alt_text_en ?? "").trim() &&
        String(a.metadata?.caption_en ?? "").trim()
    );

  const hasSchema = !!form.schema_jsonld;
  const citations = countTokens(form.citations);
  const hasCitations = citations > 0;
  const internalLinks = countTokens(
    (form as any).internal_links_json ?? (form as any).internal_links
  );
  const hasInternalLinks = internalLinks > 0;

  const issues = (form as any).score_issues_json ?? (form as any).score_issues;
  const issueList = Array.isArray(issues) ? issues : [];
  const recommendations =
    (form as any).score_recommendations_json ?? (form as any).score_recommendations;
  const recList = Array.isArray(recommendations) ? recommendations : [];

  const safetyOk =
    typeof form.safety_score !== "number" || form.safety_score >= 80;

  const requiredChecks = [
    thComplete,
    enComplete,
    visualsUploaded,
    visualsInTh,
    visualsInEn,
    altCaptionComplete,
    hasSchema,
    safetyOk,
  ];
  const requiredOk = requiredChecks.every(Boolean);
  const ready = requiredOk && issueList.length === 0;

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 space-y-4 mb-6",
        ready
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      )}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              ready ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"
            )}
          >
            {ready ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              SEO Agent Review Summary
            </div>
            <div className="font-display text-base text-foreground">
              {ready ? "พร้อมตรวจและเผยแพร่" : "ยังไม่พร้อมเผยแพร่ — ต้องแก้รายการต่อไปนี้"}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <ScorePill label="SEO" value={form.seo_score} />
          <ScorePill label="AEO" value={form.aeo_score} />
          <ScorePill label="GEO" value={form.geo_score} />
          <ScorePill label="Safety" value={form.safety_score} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 pt-1">
        <Row
          ok={thComplete}
          label="TH content complete"
          hint={thComplete ? undefined : `Missing: ${thMissing.join(", ")}`}
        />
        <Row
          ok={enComplete}
          label="EN content complete"
          hint={enComplete ? undefined : `Missing: ${enMissing.join(", ")}`}
        />
        <Row
          ok={visualsUploaded}
          label={`Visuals uploaded (${visualCount}/${expectedVisualCount})`}
        />
        <Row ok={altCaptionComplete} label="Bilingual alt/caption complete" />
        <Row ok={visualsInTh} label="Visuals embedded in content_th" />
        <Row ok={visualsInEn} label="Visuals embedded in content_en" />
        <Row ok={hasSchema} label="schema_jsonld exists" />
        <Row
          ok={hasCitations}
          label={`Citations (${citations})`}
          hint={hasCitations ? undefined : "Recommended"}
        />
        <Row
          ok={hasInternalLinks}
          label={`Internal links (${internalLinks})`}
          hint={hasInternalLinks ? undefined : "Recommended"}
        />
        <Row ok={safetyOk} label="Safety score ≥ 80" />
      </div>

      {issueList.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-700">
            <ShieldAlert className="w-3 h-3" /> Issues from SEO Agent
          </div>
          <ul className="space-y-1">
            {issueList.slice(0, 6).map((it: any, i: number) => (
              <li key={i} className="text-xs text-foreground/80 flex gap-2">
                <span className="mt-1 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                <span>
                  {it.message ?? it.title ?? JSON.stringify(it)}
                  {it.severity && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground">[{it.severity}]</span>
                  )}
                </span>
              </li>
            ))}
            {issueList.length > 6 && (
              <li className="text-[10px] text-muted-foreground">+{issueList.length - 6} more — see SEO Review tab</li>
            )}
          </ul>
        </div>
      )}

      {recList.length > 0 && (
        <div className="rounded-lg border border-border bg-background/60 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Sparkles className="w-3 h-3" /> Recommendations
          </div>
          <ul className="space-y-1">
            {recList.slice(0, 4).map((r: any, i: number) => (
              <li key={i} className="text-xs text-foreground/80 flex gap-2">
                <span className="mt-1 w-1 h-1 rounded-full bg-primary shrink-0" />
                <span>{typeof r === "string" ? r : r.message ?? JSON.stringify(r)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReviewSummary;