import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const promoTable = () => supabase.from("promotions") as any;
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Eye, Upload, X, Loader2 } from "lucide-react";

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type PromotionData = Record<string, any>;

const PromotionEditor = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PromotionData>({
    slug: "",
    status: "draft",
    is_featured: false,
    order_index: 0,
    title_th: "",
    title_en: "",
    objective_th: "",
    objective_en: "",
    suitable_for_th: "",
    suitable_for_en: "",
    tech_stack_th: "",
    tech_stack_en: "",
    notes_th: "",
    notes_en: "",
    price: "",
    compare_at_price: "",
    price_unit_th: "บาท",
    price_unit_en: "THB",
    badge_text_th: "",
    badge_text_en: "",
    cover_image_url: "",
    gallery_image_urls: [],
    alt_text_th: "",
    alt_text_en: "",
    cta_type: "link",
    cta_label_th: "",
    cta_label_en: "",
    cta_link: "",
    cta_form_id: "",
    start_at: "",
    end_at: "",
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["promotion", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await promoTable().select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        ...existing,
        price: existing.price ?? "",
        compare_at_price: existing.compare_at_price ?? "",
        start_at: existing.start_at ? existing.start_at.slice(0, 16) : "",
        end_at: existing.end_at ? existing.end_at.slice(0, 16) : "",
        gallery_image_urls: existing.gallery_image_urls ?? [],
      });
    }
  }, [existing]);

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `cover/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("promotions").upload(path, file);
    if (error) {
      toast({ title: "อัปโหลดล้มเหลว", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("promotions").getPublicUrl(path);
      set("cover_image_url", urlData.publicUrl);
    }
    setUploading(false);
  };

  const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    const urls = [...(form.gallery_image_urls as string[])];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("promotions").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("promotions").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    set("gallery_image_urls", urls);
    setUploading(false);
  };

  const removeGalleryImage = (idx: number) => {
    const urls = [...(form.gallery_image_urls as string[])];
    urls.splice(idx, 1);
    set("gallery_image_urls", urls);
  };

  const handleSave = async (publish = false) => {
    if (!form.slug) {
      toast({ title: "กรุณากรอก Slug", variant: "destructive" });
      return;
    }

    const status = publish ? "published" : form.status === "published" && !isAdmin ? form.status : form.status;

    if (publish) {
      if (!form.cover_image_url || (!form.title_th && !form.title_en) || !form.price) {
        toast({ title: "ไม่สามารถเผยแพร่ได้", description: "ต้องมีรูปปก, ชื่อ (TH หรือ EN), และราคา", variant: "destructive" });
        return;
      }
      if (!form.cta_label_th && !form.cta_label_en) {
        toast({ title: "กรุณากรอก CTA Label", variant: "destructive" });
        return;
      }
      if (form.cta_type === "link" && !form.cta_link) {
        toast({ title: "กรุณากรอก CTA Link", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload: Record<string, any> = {
      slug: form.slug,
      status: publish ? "published" : status,
      is_featured: form.is_featured,
      order_index: Number(form.order_index) || 0,
      title_th: form.title_th || null,
      title_en: form.title_en || null,
      objective_th: form.objective_th || null,
      objective_en: form.objective_en || null,
      suitable_for_th: form.suitable_for_th || null,
      suitable_for_en: form.suitable_for_en || null,
      tech_stack_th: form.tech_stack_th || null,
      tech_stack_en: form.tech_stack_en || null,
      notes_th: form.notes_th || null,
      notes_en: form.notes_en || null,
      price: form.price ? Number(form.price) : null,
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      price_unit_th: form.price_unit_th || "บาท",
      price_unit_en: form.price_unit_en || "THB",
      badge_text_th: form.badge_text_th || null,
      badge_text_en: form.badge_text_en || null,
      cover_image_url: form.cover_image_url || null,
      gallery_image_urls: form.gallery_image_urls,
      alt_text_th: form.alt_text_th || null,
      alt_text_en: form.alt_text_en || null,
      cta_type: form.cta_type,
      cta_label_th: form.cta_label_th || null,
      cta_label_en: form.cta_label_en || null,
      cta_link: form.cta_link || null,
      cta_form_id: form.cta_form_id || null,
      start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      updated_by: user?.id,
    };

    let error;
    if (isNew) {
      payload.created_by = user?.id;
      const res = await promoTable().insert(payload);
      error = res.error;
    } else {
      const res = await promoTable().update(payload).eq("id", id);
      error = res.error;
    }

    if (error) {
      toast({ title: "บันทึกล้มเหลว", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast({ title: publish ? "เผยแพร่แล้ว" : "บันทึกสำเร็จ" });
      if (isNew) navigate("/admin/promotions");
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/promotions")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display text-xl text-foreground">
              {isNew ? "สร้างโปรโมชั่นใหม่" : "แก้ไขโปรโมชั่น"}
            </h1>
            <p className="text-[10px] text-muted-foreground">{isNew ? "Create new promotion" : `Editing: ${form.slug}`}</p>
          </div>
        </div>
        <div className="flex gap-2">
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
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="basic" className="text-xs">พื้นฐาน</TabsTrigger>
          <TabsTrigger value="images" className="text-xs">รูปภาพ</TabsTrigger>
          <TabsTrigger value="content" className="text-xs">เนื้อหา</TabsTrigger>
          <TabsTrigger value="pricing" className="text-xs">ราคา</TabsTrigger>
          <TabsTrigger value="cta" className="text-xs">CTA</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs">กำหนดการ</TabsTrigger>
        </TabsList>

        {/* Basic */}
        <TabsContent value="basic" className="space-y-4">
          <Field label="Slug" sublabel="URL path">
            <div className="flex gap-2">
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="summer-promo-2026"
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="สถานะ" sublabel="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                disabled={!isAdmin && form.status !== "draft"}
              >
                <option value="draft">ร่าง (Draft)</option>
                {isAdmin && <option value="published">เผยแพร่ (Published)</option>}
                {isAdmin && <option value="archived">จัดเก็บ (Archived)</option>}
              </select>
            </Field>
            <Field label="ลำดับ" sublabel="Order Index">
              <Input type="number" value={form.order_index} onChange={(e) => set("order_index", e.target.value)} className="text-sm" />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
            <Label className="text-sm">แนะนำ (Featured)</Label>
          </div>
        </TabsContent>

        {/* Images */}
        <TabsContent value="images" className="space-y-4">
          <Field label="รูปปก" sublabel="Cover Image">
            <div className="flex gap-4 items-start">
              {form.cover_image_url ? (
                <div className="relative w-40 h-28 rounded-lg overflow-hidden border border-border">
                  <img src={form.cover_image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => set("cover_image_url", "")}
                    className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
              <label className="flex flex-col items-center justify-center w-40 h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
                <span className="text-[10px] text-muted-foreground mt-1">อัปโหลด</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadCover} />
              </label>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Alt Text TH">
              <Input value={form.alt_text_th} onChange={(e) => set("alt_text_th", e.target.value)} className="text-sm" />
            </Field>
            <Field label="Alt Text EN">
              <Input value={form.alt_text_en} onChange={(e) => set("alt_text_en", e.target.value)} className="text-sm" />
            </Field>
          </div>

          <Field label="รูปแกลเลอรี" sublabel="Gallery Images">
            <div className="flex gap-2 flex-wrap">
              {(form.gallery_image_urls as string[]).map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeGalleryImage(i)}
                    className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleUploadGallery} />
              </label>
            </div>
          </Field>
        </TabsContent>

        {/* Content */}
        <TabsContent value="content" className="space-y-5">
          {[
            { key: "title", label: "ชื่อ", sublabel: "Title" },
            { key: "objective", label: "จุดประสงค์", sublabel: "Objective" },
            { key: "suitable_for", label: "เหมาะสำหรับ", sublabel: "Suitable For" },
            { key: "tech_stack", label: "เทคโนโลยี", sublabel: "Technology" },
            { key: "notes", label: "หมายเหตุ", sublabel: "Notes" },
          ].map(({ key, label, sublabel }) => (
            <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={`${label} (TH)`} sublabel={sublabel}>
                {key === "title" ? (
                  <Input value={form[`${key}_th`]} onChange={(e) => set(`${key}_th`, e.target.value)} className="text-sm" />
                ) : (
                  <Textarea value={form[`${key}_th`]} onChange={(e) => set(`${key}_th`, e.target.value)} rows={3} className="text-sm" />
                )}
              </Field>
              <Field label={`${label} (EN)`} sublabel={sublabel}>
                {key === "title" ? (
                  <Input value={form[`${key}_en`]} onChange={(e) => set(`${key}_en`, e.target.value)} className="text-sm" />
                ) : (
                  <Textarea value={form[`${key}_en`]} onChange={(e) => set(`${key}_en`, e.target.value)} rows={3} className="text-sm" />
                )}
              </Field>
            </div>
          ))}
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="ราคา" sublabel="Price">
              <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className="text-sm" />
            </Field>
            <Field label="ราคาเปรียบเทียบ" sublabel="Compare At Price">
              <Input type="number" value={form.compare_at_price} onChange={(e) => set("compare_at_price", e.target.value)} className="text-sm" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="หน่วยราคา (TH)">
              <Input value={form.price_unit_th} onChange={(e) => set("price_unit_th", e.target.value)} className="text-sm" />
            </Field>
            <Field label="หน่วยราคา (EN)">
              <Input value={form.price_unit_en} onChange={(e) => set("price_unit_en", e.target.value)} className="text-sm" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Badge (TH)">
              <Input value={form.badge_text_th} onChange={(e) => set("badge_text_th", e.target.value)} placeholder="เช่น ลด 30%" className="text-sm" />
            </Field>
            <Field label="Badge (EN)">
              <Input value={form.badge_text_en} onChange={(e) => set("badge_text_en", e.target.value)} placeholder="e.g. 30% OFF" className="text-sm" />
            </Field>
          </div>
        </TabsContent>

        {/* CTA */}
        <TabsContent value="cta" className="space-y-4">
          <Field label="ประเภท CTA" sublabel="CTA Type">
            <select
              value={form.cta_type}
              onChange={(e) => set("cta_type", e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
            >
              <option value="link">ลิงก์ (Link)</option>
              <option value="form">ฟอร์ม (Form)</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="CTA Label (TH)">
              <Input value={form.cta_label_th} onChange={(e) => set("cta_label_th", e.target.value)} placeholder="จองเลย" className="text-sm" />
            </Field>
            <Field label="CTA Label (EN)">
              <Input value={form.cta_label_en} onChange={(e) => set("cta_label_en", e.target.value)} placeholder="Book Now" className="text-sm" />
            </Field>
          </div>
          {form.cta_type === "link" ? (
            <Field label="CTA Link">
              <Input value={form.cta_link} onChange={(e) => set("cta_link", e.target.value)} placeholder="https://..." className="text-sm" />
            </Field>
          ) : (
            <Field label="Form ID">
              <Input value={form.cta_form_id} onChange={(e) => set("cta_form_id", e.target.value)} placeholder="consultation" className="text-sm" />
            </Field>
          )}
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="เริ่มแสดง" sublabel="Start At">
              <Input type="datetime-local" value={form.start_at} onChange={(e) => set("start_at", e.target.value)} className="text-sm" />
            </Field>
            <Field label="สิ้นสุด" sublabel="End At">
              <Input type="datetime-local" value={form.end_at} onChange={(e) => set("end_at", e.target.value)} className="text-sm" />
            </Field>
          </div>
          {form.end_at && new Date(form.end_at) < new Date() && (
            <p className="text-xs text-destructive">⚠️ โปรโมชั่นนี้หมดอายุแล้ว — จะไม่แสดงบนเว็บไซต์</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PromotionEditor;
