import { useState, useEffect } from "react";
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
import { ArrowLeft, Save, Eye, Upload, X, Loader2, ExternalLink } from "lucide-react";
import BlogAiAssistant, { type BlogInsertData } from "@/components/admin/BlogAiAssistant";

const blogTable = () => supabase.from("blog_articles") as any;

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9ก-๙]+/gu, "-").replace(/(^-|-$)/g, "");

type BlogData = Record<string, any>;

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
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");

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
    }

    let error;
    if (isNew) {
      const res = await blogTable().insert(payload);
      error = res.error;
    } else {
      const { created_by, ...updatePayload } = payload;
      const res = await blogTable().update(updatePayload).eq("id", id);
      error = res.error;
    }

    if (error) {
      toast({ title: "บันทึกล้มเหลว", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast({ title: publish ? "เผยแพร่แล้ว" : "บันทึกสำเร็จ" });
      if (isNew) navigate("/admin/blogs");
    }
    setSaving(false);
  };

  const Field = ({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) => (
    <div>
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
        {label} {sublabel && <span className="normal-case text-[10px]">({sublabel})</span>}
      </Label>
      <div className="mt-1">{children}</div>
    </div>
  );

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
          <BlogAiAssistant
            onInsert={(data: BlogInsertData) => {
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
        <TabsList className="bg-muted/50">
          <TabsTrigger value="content" className="text-xs">เนื้อหา</TabsTrigger>
          <TabsTrigger value="media" className="text-xs">รูปภาพ & Tags</TabsTrigger>
          <TabsTrigger value="seo" className="text-xs">SEO</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default BlogEditor;
