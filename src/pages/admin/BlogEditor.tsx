import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  X,
  Loader2,
  ExternalLink,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  ClipboardCheck,
  FileJson,
  Image as ImageIcon,
  Bot,
  Copy,
  ImagePlus,
  Check,
  Pencil,
} from "lucide-react";
import BlogAiAssistant, { type BlogInsertData } from "@/components/admin/BlogAiAssistant";

const blogTable = () => supabase.from("blog_articles") as any;

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9ก-๙]+/gu, "-").replace(/(^-|-$)/g, "");

type BlogData = Record<string, any>;

const Field = ({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
      {label} {sublabel && <span className="normal-case text-[10px]">({sublabel})</span>}
    </Label>
    <div className="mt-1">{children}</div>
  </div>
);

const ScoreBadge = ({ label, value }: { label: string; value: number | null | undefined }) => {
  const v = typeof value === "number" ? value : null;
  const tone =
    v === null
      ? "bg-muted text-muted-foreground"
      : v >= 80
        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
        : v >= 60
          ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
          : "bg-destructive/10 text-destructive border-destructive/30";
  return (
    <div className={`rounded-lg border px-3 py-2 ${tone}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="font-display text-xl">{v === null ? "—" : v}</div>
    </div>
  );
};

const JsonPreview = ({ title, value }: { title: string; value: any }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
        <FileJson className="w-3 h-3" /> {title}
      </div>
      <pre className="text-[11px] font-mono whitespace-pre-wrap break-all max-h-64 overflow-auto text-foreground/80">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
};

const APPROVAL_CHECKLIST = [
  { key: "content", label: "ตรวจเนื้อหา (Content reviewed)" },
  { key: "medical", label: "ตรวจข้อมูลทางการแพทย์ (Medical claims reviewed)" },
  { key: "seo", label: "ตรวจ SEO metadata" },
  { key: "links", label: "ตรวจ Internal links" },
  { key: "visuals", label: "ตรวจรูปภาพ & alt text (Visuals/alt text reviewed)" },
] as const;

const VisualAssetPreview = ({ url, alt }: { url: string | null; alt: string }) => {
  const [errored, setErrored] = useState(false);

  if (!url) {
    return (
      <div className="aspect-video bg-muted flex items-center justify-center text-xs text-muted-foreground">
        No asset URL
      </div>
    );
  }

  if (errored) {
    return (
      <div className="aspect-video bg-muted flex flex-col items-center justify-center gap-1 text-xs text-destructive p-3 text-center">
        <span>Image failed to load</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="underline break-all text-foreground/70 hover:text-foreground"
        >
          {url}
        </a>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className="w-full aspect-video object-contain bg-white"
    />
  );
};

const BlogEditor = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<BlogData>({
    slug: "",
    status: "draft",
    title_th: "",
    title_en: "",
    excerpt_th: "",
    excerpt_en: "",
    content_th: "",
    content_en: "",
    cover_image_url: "",
    tags: [],
    meta_title_th: "",
    meta_title_en: "",
    meta_description_th: "",
    meta_description_en: "",
    source_system: "manual",
    workflow_status: "none",
    seo_score: null,
    aeo_score: null,
    geo_score: null,
    safety_score: null,
    citations: [],
    schema_jsonld: null,
    answer_summary: "",
    target_intent: "",
    target_keyword: "",
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [coverPrompt, setCoverPrompt] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);
  const pendingAiSave = useRef(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [confirmUnsafe, setConfirmUnsafe] = useState(false);
  const [insertingVisuals, setInsertingVisuals] = useState(false);

  const isSeoAgent =
    form.source_system === "seo_agent_mcp" || form.workflow_status === "needs_review";

  const { data: visualAssets = [] } = useQuery({
    queryKey: ["article-visual-assets", id],
    queryFn: async () => {
      if (isNew) return [] as any[];
      const { data, error } = await (supabase.from("article_visual_assets") as any)
        .select("*")
        .eq("article_id", id)
        .order("position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !isNew,
  });

  const { data: existing } = useQuery({
    queryKey: ["blog-article", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await blogTable().select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        ...existing,
        tags: existing.tags ?? [],
        cover_image_url: existing.cover_image_url ?? "",
      });
    }
  }, [existing]);

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `blog/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("promotions").upload(path, file);
    if (error) {
      toast({ title: "อัปโหลดล้มเหลว", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("promotions").getPublicUrl(path);
      set("cover_image_url", urlData.publicUrl);
    }
    setUploading(false);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !(form.tags as string[]).includes(tag)) {
      set("tags", [...(form.tags as string[]), tag]);
    }
    setTagInput("");
  };

  const removeTag = (t: string) => {
    set("tags", (form.tags as string[]).filter((x) => x !== t));
  };

  const handleInsertVisuals = async () => {
    if (isNew || !id) {
      toast({ title: "กรุณาบันทึกบทความก่อน", variant: "destructive" });
      return;
    }
    setInsertingVisuals(true);
    try {
      const { data: assets, error } = await (supabase.from("article_visual_assets") as any)
        .select("*")
        .eq("article_id", id)
        .order("position", { ascending: true });
      if (error) throw error;
      const list = (assets ?? []).filter(
        (a: any) => a.asset_url || a.metadata?.uploaded_asset_url
      );
      if (list.length === 0) {
        toast({ title: "ไม่มีรูปภาพประกอบให้แทรก", variant: "destructive" });
        return;
      }

      const currentContent = form.content_th || "";
      // Filter out images already present in content
      const pending = list.filter((a: any) => {
        const url = a.asset_url ?? a.metadata?.uploaded_asset_url;
        return url && !currentContent.includes(url);
      });
      if (pending.length === 0) {
        toast({ title: "Visuals already inserted" });
        return;
      }

      const buildBlock = (a: any) => {
        const url = a.asset_url ?? a.metadata?.uploaded_asset_url;
        const alt = (a.alt_text ?? "").replace(/[\[\]]/g, "");
        const caption = a.caption ? `\n\n*${a.caption}*` : "";
        return `![${alt}](${url})${caption}`;
      };

      // Interleave between H2 sections (skip the first H2 to avoid putting an image before the intro).
      const lines = currentContent.split("\n");
      const h2Indices: number[] = [];
      lines.forEach((ln, idx) => {
        if (ln.trim().startsWith("## ")) h2Indices.push(idx);
      });

      let newContent: string;
      if (h2Indices.length >= 2) {
        // Insertion slots = positions just before each H2 starting from the 2nd.
        const slots = h2Indices.slice(1);
        const result: string[] = [];
        let assetIdx = 0;
        for (let i = 0; i < lines.length; i++) {
          if (slots.includes(i) && assetIdx < pending.length) {
            result.push("", buildBlock(pending[assetIdx]), "");
            assetIdx++;
          }
          result.push(lines[i]);
        }
        // Any remaining images go under a trailing section.
        if (assetIdx < pending.length) {
          result.push("", "## ภาพประกอบเพิ่มเติม", "");
          for (let j = assetIdx; j < pending.length; j++) {
            result.push(buildBlock(pending[j]), "");
          }
        }
        newContent = result.join("\n");
      } else {
        // Fallback: append under a dedicated section.
        const separator = currentContent.endsWith("\n") ? "\n" : "\n\n";
        newContent = `${currentContent}${separator}## ภาพประกอบในบทความ\n\n${pending.map(buildBlock).join("\n\n")}\n`;
      }

      const { error: updateErr } = await blogTable()
        .update({ content_th: newContent })
        .eq("id", id);
      if (updateErr) throw updateErr;

      set("content_th", newContent);
      queryClient.invalidateQueries({ queryKey: ["blog-article", id] });
      toast({ title: `แทรกรูปภาพ ${pending.length} รายการสำเร็จ` });
    } catch (err: any) {
      toast({ title: "แทรกรูปภาพล้มเหลว", description: err.message, variant: "destructive" });
    } finally {
      setInsertingVisuals(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!form.title_th && !form.title_en) {
      toast({ title: "กรุณากรอกชื่อบทความก่อนสร้างรูปปก", variant: "destructive" });
      return;
    }
    setGeneratingCover(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-generate-cover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            title: form.title_th || form.title_en,
            excerpt: form.excerpt_th || form.excerpt_en,
            tags: (form.tags as string[])?.length ? (form.tags as string[]).join(", ") : undefined,
            content_summary: (form.content_th || form.content_en || "").slice(0, 500) || undefined,
            extra_prompt: coverPrompt || undefined,
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "สร้างรูปภาพล้มเหลว");
      set("cover_image_url", data.url);
      toast({ title: "สร้างรูปปกสำเร็จ ✨" });
    } catch (err: any) {
      toast({ title: "สร้างรูปปกล้มเหลว", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleSave = async (publish = false) => {
    if (!form.slug) {
      toast({ title: "กรุณากรอก Slug", variant: "destructive" });
      return;
    }
    if (!form.content_th) {
      toast({ title: "กรุณากรอกเนื้อหา (TH)", variant: "destructive" });
      return;
    }
    if (publish && !form.title_th) {
      toast({ title: "ต้องมีชื่อบทความ (TH) เพื่อเผยแพร่", variant: "destructive" });
      return;
    }
    if (publish && isSeoAgent) {
      const allChecked = APPROVAL_CHECKLIST.every((c) => checklist[c.key]);
      if (!allChecked) {
        toast({
          title: "กรุณาทำรายการตรวจสอบให้ครบก่อนเผยแพร่",
          description: "Approval checklist incomplete",
          variant: "destructive",
        });
        return;
      }
      if (typeof form.safety_score === "number" && form.safety_score < 80 && !confirmUnsafe) {
        toast({
          title: "Safety score < 80 — ต้องยืนยันก่อนเผยแพร่",
          description: "Tick the manual safety confirmation in the Approval tab.",
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload: Record<string, any> = {
      slug: form.slug,
      status: publish ? "published" : form.status,
      title_th: form.title_th || "",
      title_en: form.title_en || null,
      excerpt_th: form.excerpt_th || null,
      excerpt_en: form.excerpt_en || null,
      content_th: form.content_th,
      content_en: form.content_en || null,
      cover_image_url: form.cover_image_url || null,
      tags: form.tags,
      meta_title_th: form.meta_title_th || null,
      meta_title_en: form.meta_title_en || null,
      meta_description_th: form.meta_description_th || null,
      meta_description_en: form.meta_description_en || null,
      created_by: user?.id,
    };

    if (publish && form.status !== "published") {
      payload.published_at = new Date().toISOString();
      if (isSeoAgent) {
        payload.workflow_status = "published";
        // Approval timestamp/actor are recorded in content_approval_events.
        // We intentionally do NOT write final_approved_at/final_approved_by here
        // because those columns are not present in the current blog_articles schema.
      }
    }

    let error;
    let savedId: string | undefined = isNew ? undefined : (id as string);
    if (isNew) {
      const res = await blogTable().insert(payload).select("id").single();
      error = res.error;
      if (!error && res.data?.id) {
        savedId = res.data.id;
        queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
        toast({ title: publish ? "เผยแพร่แล้ว" : "บันทึกสำเร็จ" });
        navigate(`/admin/blogs/${res.data.id}`, { replace: true });
        setSaving(false);
        return;
      }
    } else {
      const { created_by, ...updatePayload } = payload;
      const res = await blogTable().update(updatePayload).eq("id", id);
      error = res.error;
    }

    if (error) {
      toast({ title: "บันทึกล้มเหลว", description: error.message, variant: "destructive" });
    } else {
      if (publish && savedId) {
        try {
          await (supabase.from("content_approval_events") as any).insert({
            article_id: savedId,
            event_type: isSeoAgent ? "seo_agent_published" : "published",
            actor_id: user?.id ?? null,
            actor_label: user?.email ?? null,
            notes: isSeoAgent
              ? `Approved via editor checklist${confirmUnsafe ? " (safety override)" : ""}`
              : null,
            snapshot: {
              source_system: form.source_system,
              workflow_status: "published",
              seo_score: form.seo_score,
              aeo_score: form.aeo_score,
              geo_score: form.geo_score,
              safety_score: form.safety_score,
              checklist,
            },
          });
        } catch (e) {
          console.warn("approval event insert failed", e);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast({ title: publish ? "เผยแพร่แล้ว" : "บันทึกสำเร็จ" });
    }
    setSaving(false);
  };

  // Auto-save draft after AI insert
  useEffect(() => {
    if (!pendingAiSave.current) return;
    pendingAiSave.current = false;
    if (!form.slug || !form.content_th) return;

    const autoSaveDraft = async () => {
      setAutoSaveStatus("กำลังบันทึกร่างอัตโนมัติ...");
      const { data: { user } } = await supabase.auth.getUser();
      const payload: Record<string, any> = {
        slug: form.slug,
        status: "draft",
        title_th: form.title_th || "",
        title_en: form.title_en || null,
        excerpt_th: form.excerpt_th || null,
        excerpt_en: form.excerpt_en || null,
        content_th: form.content_th,
        content_en: form.content_en || null,
        cover_image_url: form.cover_image_url || null,
        tags: form.tags,
        meta_title_th: form.meta_title_th || null,
        meta_title_en: form.meta_title_en || null,
        meta_description_th: form.meta_description_th || null,
        meta_description_en: form.meta_description_en || null,
        created_by: user?.id,
      };
      let error;
      if (isNew) {
        const res = await blogTable().insert(payload).select("id").single();
        error = res.error;
        if (!error && res.data?.id) {
          setAutoSaveStatus("บันทึกร่างอัตโนมัติแล้ว ✓");
          queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
          navigate(`/admin/blogs/${res.data.id}`, { replace: true });
          setTimeout(() => setAutoSaveStatus(null), 3000);
          return;
        }
      } else {
        const { created_by, ...updatePayload } = payload;
        const res = await blogTable().update(updatePayload).eq("id", id);
        error = res.error;
      }
      if (error) {
        setAutoSaveStatus("บันทึกอัตโนมัติล้มเหลว");
        console.warn("Auto-save failed:", error.message);
      } else {
        setAutoSaveStatus("บันทึกร่างอัตโนมัติแล้ว ✓");
        queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      }
      setTimeout(() => setAutoSaveStatus(null), 3000);
    };
    autoSaveDraft();
  }, [form]); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div className="p-4 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/blogs")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display text-xl text-foreground">
              {isNew ? "เขียนบทความใหม่" : "แก้ไขบทความ"}
            </h1>
            <p className="text-[10px] text-muted-foreground">{isNew ? "Create new article" : `Editing: ${form.slug}`}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {autoSaveStatus && (
            <span className="text-[10px] text-muted-foreground self-center animate-pulse">{autoSaveStatus}</span>
          )}
          <BlogAiAssistant
            onInsert={(data: BlogInsertData) => {
              pendingAiSave.current = true;
              setForm((prev) => ({
                ...prev,
                ...(data.title_th && { title_th: data.title_th }),
                ...(data.title_en && { title_en: data.title_en }),
                ...(data.excerpt_th && { excerpt_th: data.excerpt_th }),
                ...(data.excerpt_en && { excerpt_en: data.excerpt_en }),
                ...(data.content_th && { content_th: data.content_th }),
                ...(data.content_en && { content_en: data.content_en }),
                ...(data.meta_title_th && { meta_title_th: data.meta_title_th }),
                ...(data.meta_title_en && { meta_title_en: data.meta_title_en }),
                ...(data.meta_description_th && { meta_description_th: data.meta_description_th }),
                ...(data.meta_description_en && { meta_description_en: data.meta_description_en }),
                ...(data.tags && { tags: data.tags }),
                ...(data.slug && { slug: data.slug }),
              }));
            }}
            context={form.title_th}
          />
          {!isNew && form.status === "published" && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
              <a href={`/blog/${form.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
                ดูบทความ
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving} className="gap-1.5 text-xs">
            <Save className="w-3.5 h-3.5" />
            {saving ? "กำลังบันทึก..." : "บันทึกร่าง"}
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={() => handleSave(true)} disabled={saving} className="gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5" />
              เผยแพร่
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="content" className="text-xs">เนื้อหา</TabsTrigger>
          <TabsTrigger value="media" className="text-xs">รูปภาพ & Tags</TabsTrigger>
          <TabsTrigger value="seo" className="text-xs">SEO</TabsTrigger>
          {isSeoAgent && (
            <>
              <TabsTrigger value="seo-review" className="text-xs gap-1">
                <Bot className="w-3 h-3" /> SEO Review
              </TabsTrigger>
              <TabsTrigger value="structured" className="text-xs">Structured Data</TabsTrigger>
              <TabsTrigger value="visuals" className="text-xs">Visual Assets</TabsTrigger>
              <TabsTrigger value="approval" className="text-xs gap-1">
                <ClipboardCheck className="w-3 h-3" /> Approval
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-5">
          <Field label="Slug" sublabel="URL path">
            <div className="flex gap-2">
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="acne-scar-treatment-guide"
                className="text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                className="text-xs shrink-0"
                onClick={() => set("slug", slugify(form.title_en || form.title_th || ""))}
              >
                สร้างจากชื่อ
              </Button>
            </div>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ชื่อบทความ (TH)" sublabel="Title">
              <Input value={form.title_th} onChange={(e) => set("title_th", e.target.value)} className="text-sm" />
            </Field>
            <Field label="ชื่อบทความ (EN)" sublabel="Title">
              <Input value={form.title_en} onChange={(e) => set("title_en", e.target.value)} className="text-sm" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="บทคัดย่อ (TH)" sublabel="Excerpt">
              <Textarea value={form.excerpt_th} onChange={(e) => set("excerpt_th", e.target.value)} rows={2} className="text-sm" />
            </Field>
            <Field label="บทคัดย่อ (EN)" sublabel="Excerpt">
              <Textarea value={form.excerpt_en} onChange={(e) => set("excerpt_en", e.target.value)} rows={2} className="text-sm" />
            </Field>
          </div>

          <Field label="เนื้อหา (TH)" sublabel="Content — รองรับ Markdown">
            <Textarea value={form.content_th} onChange={(e) => set("content_th", e.target.value)} rows={16} className="text-sm font-mono" />
          </Field>

          <Field label="เนื้อหา (EN)" sublabel="Content — supports Markdown">
            <Textarea value={form.content_en} onChange={(e) => set("content_en", e.target.value)} rows={16} className="text-sm font-mono" />
          </Field>
        </TabsContent>

        {/* Media & Tags Tab */}
        <TabsContent value="media" className="space-y-5">
          <Field label="รูปปก" sublabel="Cover Image">
            <div className="flex gap-4 items-start">
              {form.cover_image_url ? (
                <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-border">
                  <img src={form.cover_image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => set("cover_image_url", "")}
                    className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
              <label className="flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
                <span className="text-[10px] text-muted-foreground mt-1">อัปโหลดรูปปก</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadCover} />
              </label>
              <button
                onClick={handleGenerateCover}
                disabled={generatingCover}
                className="flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingCover ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <Sparkles className="w-5 h-5 text-primary" />
                )}
                <span className="text-[10px] text-primary mt-1">
                  {generatingCover ? "กำลังสร้าง..." : "AI สร้างรูปปก"}
                </span>
              </button>
            </div>
            <div className="w-full mt-3">
              <Textarea
                value={coverPrompt}
                onChange={(e) => setCoverPrompt(e.target.value)}
                placeholder="เพิ่ม prompt สำหรับ AI สร้างรูปปก เช่น 'เน้นโทนสีฟ้า มีลวดลายคลื่น'..."
                rows={2}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">ไม่จำเป็นต้องกรอก — AI จะใช้ชื่อบทความและบทคัดย่อเป็นหลัก</p>
            </div>
          </Field>

          <Field label="แท็ก" sublabel="Tags">
            <div className="flex gap-2 flex-wrap mb-2">
              {(form.tags as string[]).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-xs">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="พิมพ์แท็กแล้ว Enter"
                className="text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              />
              <Button variant="outline" size="sm" onClick={addTag} className="text-xs">เพิ่ม</Button>
            </div>
          </Field>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Meta Title (TH)">
              <Input value={form.meta_title_th} onChange={(e) => set("meta_title_th", e.target.value)} className="text-sm" placeholder="ไม่เกิน 60 ตัวอักษร" />
              <p className="text-[10px] text-muted-foreground mt-1">{(form.meta_title_th || "").length}/60</p>
            </Field>
            <Field label="Meta Title (EN)">
              <Input value={form.meta_title_en} onChange={(e) => set("meta_title_en", e.target.value)} className="text-sm" placeholder="Max 60 characters" />
              <p className="text-[10px] text-muted-foreground mt-1">{(form.meta_title_en || "").length}/60</p>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Meta Description (TH)">
              <Textarea value={form.meta_description_th} onChange={(e) => set("meta_description_th", e.target.value)} rows={3} className="text-sm" placeholder="ไม่เกิน 160 ตัวอักษร" />
              <p className="text-[10px] text-muted-foreground mt-1">{(form.meta_description_th || "").length}/160</p>
            </Field>
            <Field label="Meta Description (EN)">
              <Textarea value={form.meta_description_en} onChange={(e) => set("meta_description_en", e.target.value)} rows={3} className="text-sm" placeholder="Max 160 characters" />
              <p className="text-[10px] text-muted-foreground mt-1">{(form.meta_description_en || "").length}/160</p>
            </Field>
          </div>
        </TabsContent>

        {/* SEO Review Tab */}
        {isSeoAgent && (
          <TabsContent value="seo-review" className="space-y-5">
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex flex-wrap gap-3 items-center text-xs">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  source: {form.source_system || "manual"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                  workflow: {form.workflow_status || "none"}
                </span>
                {form.target_keyword && (
                  <span className="text-muted-foreground">
                    keyword: <span className="text-foreground">{form.target_keyword}</span>
                  </span>
                )}
                {form.target_intent && (
                  <span className="text-muted-foreground">
                    intent: <span className="text-foreground">{form.target_intent}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ScoreBadge label="SEO" value={form.seo_score} />
              <ScoreBadge label="AEO" value={form.aeo_score} />
              <ScoreBadge label="GEO" value={form.geo_score} />
              <ScoreBadge label="Safety" value={form.safety_score} />
            </div>

            {typeof form.safety_score === "number" && form.safety_score < 80 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
                <div className="text-xs text-destructive">
                  <div className="font-medium mb-1">Safety score ต่ำกว่า 80</div>
                  <div className="text-destructive/80">
                    บทความนี้อาจมีเนื้อหาทางการแพทย์ที่ต้องตรวจสอบเพิ่มเติม ต้องยืนยันด้วยตนเองในแท็บ Approval ก่อนเผยแพร่
                  </div>
                </div>
              </div>
            )}

            {(() => {
              const issues = (form as any).score_issues_json ?? (form as any).score_issues;
              if (!issues) return null;
              const list = Array.isArray(issues) ? issues : [];
              if (list.length === 0) return null;
              const grouped = list.reduce((acc: Record<string, any[]>, it: any) => {
                const k = `${it.category ?? "general"} · ${it.severity ?? "info"}`;
                (acc[k] ||= []).push(it);
                return acc;
              }, {});
              return (
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Issues checklist</div>
                  {Object.entries(grouped).map(([group, items]) => (
                    <div key={group} className="rounded-lg border border-border p-3">
                      <div className="text-[11px] font-medium text-foreground mb-2">{group}</div>
                      <ul className="space-y-1.5">
                        {(items as any[]).map((it, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="text-foreground/80">{it.message ?? it.title ?? JSON.stringify(it)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              );
            })()}

            {(() => {
              const recs = (form as any).score_recommendations_json ?? (form as any).score_recommendations;
              const list = Array.isArray(recs) ? recs : [];
              if (list.length === 0) return null;
              return (
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recommendations</div>
                  <ul className="space-y-1.5 text-xs">
                    {list.map((r: any, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground/80">{typeof r === "string" ? r : r.message ?? JSON.stringify(r)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {form.answer_summary && (
              <Field label="Answer summary" sublabel="AEO">
                <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-foreground/80 whitespace-pre-wrap">
                  {form.answer_summary}
                </div>
              </Field>
            )}
          </TabsContent>
        )}

        {/* Structured Data Tab */}
        {isSeoAgent && (
          <TabsContent value="structured" className="space-y-4">
            <JsonPreview title="FAQ JSON" value={(form as any).faq_json} />
            <JsonPreview title="Schema JSON" value={(form as any).schema_json} />
            <JsonPreview title="Schema JSON-LD" value={form.schema_jsonld} />
            <JsonPreview title="Internal Links" value={(form as any).internal_links_json} />
            <JsonPreview title="Citations" value={form.citations} />
            {!form.schema_jsonld &&
              !(form as any).faq_json &&
              !(form as any).schema_json &&
              !(form as any).internal_links_json &&
              (!form.citations || (Array.isArray(form.citations) && form.citations.length === 0)) && (
                <div className="text-xs text-muted-foreground italic">ยังไม่มีข้อมูล structured data</div>
              )}
          </TabsContent>
        )}

        {/* Visual Assets Tab */}
        {isSeoAgent && (
          <TabsContent value="visuals" className="space-y-4">
            <JsonPreview title="visual_assets_json (raw)" value={(form as any).visual_assets_json} />
            {visualAssets.length === 0 ? (
              <div className="text-xs text-muted-foreground italic flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> ยังไม่มีรูปภาพประกอบที่ผูกกับบทความนี้
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">
                    แทรกรูปภาพทั้งหมดเป็น Markdown ใน <span className="font-medium text-foreground">content_th</span> ใต้หัวข้อ
                    <span className="font-medium text-foreground"> "## ภาพประกอบในบทความ"</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleInsertVisuals}
                    disabled={insertingVisuals}
                  >
                    {insertingVisuals ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                    Insert visuals into content
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visualAssets.map((a: any) => (
                  <div key={a.id} className="rounded-lg border border-border overflow-hidden bg-muted/20">
                    <VisualAssetPreview
                      url={a.asset_url ?? a.metadata?.uploaded_asset_url ?? null}
                      alt={a.alt_text ?? ""}
                    />
                    <div className="p-3 space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase tracking-wider">
                          {a.role ?? "inline"}
                        </span>
                        <span className="text-muted-foreground">#{a.position ?? 0}</span>
                      </div>
                      {a.alt_text && (
                        <div>
                          <span className="text-muted-foreground">alt: </span>
                          <span className="text-foreground/80">{a.alt_text}</span>
                        </div>
                      )}
                      {a.caption && (
                        <div>
                          <span className="text-muted-foreground">caption: </span>
                          <span className="text-foreground/80">{a.caption}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                </div>
              </>
            )}
          </TabsContent>
        )}

        {/* Approval Tab */}
        {isSeoAgent && (
          <TabsContent value="approval" className="space-y-5">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Editor checklist</div>
              <div className="space-y-2.5">
                {APPROVAL_CHECKLIST.map((item) => (
                  <label key={item.key} className="flex items-start gap-2.5 text-sm cursor-pointer">
                    <Checkbox
                      checked={!!checklist[item.key]}
                      onCheckedChange={(v) =>
                        setChecklist((prev) => ({ ...prev, [item.key]: v === true }))
                      }
                    />
                    <span className="text-foreground/80 leading-tight">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {typeof form.safety_score === "number" && form.safety_score < 80 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                  <ShieldAlert className="w-4 h-4" /> Manual safety confirmation required
                </div>
                <label className="flex items-start gap-2.5 text-xs cursor-pointer text-destructive/90">
                  <Checkbox
                    checked={confirmUnsafe}
                    onCheckedChange={(v) => setConfirmUnsafe(v === true)}
                  />
                  <span>
                    ฉันได้ตรวจสอบเนื้อหาทางการแพทย์ด้วยตนเองและยืนยันว่าปลอดภัยสำหรับเผยแพร่
                  </span>
                </label>
              </div>
            )}

            <div className="text-[11px] text-muted-foreground">
              บทความจะอยู่สถานะ <span className="font-medium text-foreground">draft</span> จนกว่าจะกดปุ่ม
              <span className="font-medium text-foreground"> "เผยแพร่" </span> ด้านบน เมื่อเผยแพร่แล้ว ระบบจะตั้งค่า
              <code className="mx-1 px-1 py-0.5 rounded bg-muted text-[10px]">workflow_status = "published"</code>
              และบันทึก approval event อัตโนมัติ
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default BlogEditor;
