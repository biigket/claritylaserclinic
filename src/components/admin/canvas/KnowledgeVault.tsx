import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Upload, Trash2, Loader2, FileText, Image, File, CheckCircle, AlertCircle, ImagePlus, Tag } from "lucide-react";

interface KnowledgeDoc {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  tags: string[];
  status: string;
  created_at: string;
}

interface ReferenceImage {
  id: string;
  title: string;
  category: string;
  tags: string[];
  image_url: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

const EXTRACT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-document-text`;

const fileIcon = (type: string) => {
  if (type?.includes("pdf")) return <FileText className="w-4 h-4 text-red-500" />;
  if (type?.includes("image")) return <Image className="w-4 h-4 text-blue-500" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
};

const statusBadge = (status: string) => {
  switch (status) {
    case "ready":
      return <Badge variant="outline" className="text-[10px] gap-1 border-green-300 text-green-700"><CheckCircle className="w-2.5 h-2.5" />พร้อมใช้</Badge>;
    case "processing":
      return <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary"><Loader2 className="w-2.5 h-2.5 animate-spin" />กำลังอ่าน...</Badge>;
    case "failed":
      return <Badge variant="outline" className="text-[10px] gap-1 border-destructive/30 text-destructive"><AlertCircle className="w-2.5 h-2.5" />อ่านไม่ได้</Badge>;
    default:
      return null;
  }
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const CATEGORY_OPTIONS = [
  { value: "device", label: "เครื่องมือแพทย์" },
  { value: "doctor", label: "แพทย์/บุคลากร" },
  { value: "clinic", label: "คลินิก/สถานที่" },
  { value: "result", label: "ผลลัพธ์การรักษา" },
  { value: "product", label: "ผลิตภัณฑ์" },
  { value: "general", label: "ทั่วไป" },
];

const KnowledgeVault = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refImageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingRef, setDeletingRef] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"docs" | "images">("docs");
  const [newCategory, setNewCategory] = useState("device");
  const [newTags, setNewTags] = useState("");

  // Knowledge documents query
  const { data: documents = [], isLoading } = useQuery<KnowledgeDoc[]>({
    queryKey: ["knowledge-documents"],
    queryFn: async () => {
      const { data } = await (supabase.from("knowledge_documents") as any)
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as KnowledgeDoc[];
    },
  });

  // Reference images query
  const { data: refImages = [], isLoading: refLoading } = useQuery<ReferenceImage[]>({
    queryKey: ["reference-images"],
    queryFn: async () => {
      const { data } = await (supabase.from("reference_images") as any)
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as ReferenceImage[];
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();

    for (const file of Array.from(files)) {
      try {
        const filePath = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("knowledge")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: doc, error: insertError } = await (supabase.from("knowledge_documents") as any)
          .insert({
            title: file.name.replace(/\.[^.]+$/, ""),
            file_name: file.name,
            file_url: filePath,
            file_type: file.type || "unknown",
            file_size: file.size,
            status: "processing",
            created_by: user?.id,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;

        fetch(EXTRACT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            documentId: doc.id,
            fileUrl: filePath,
            fileName: file.name,
            fileType: file.type,
          }),
        }).then(() => {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
          }, 3000);
        });

        toast({ title: `อัปโหลด "${file.name}" สำเร็จ`, description: "AI กำลังอ่านเอกสาร..." });
      } catch (err: any) {
        toast({ title: `อัปโหลด "${file.name}" ล้มเหลว`, description: err.message, variant: "destructive" });
      }
    }

    queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadRefImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploadingRef(true);
    const { data: { user } } = await supabase.auth.getUser();
    const tagsArr = newTags.trim() ? newTags.split(",").map(t => t.trim()).filter(Boolean) : [];

    for (const file of Array.from(files)) {
      try {
        const filePath = `ref/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("promotions")
          .upload(filePath, file, { contentType: file.type, upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("promotions").getPublicUrl(filePath);

        const { error: insertError } = await (supabase.from("reference_images") as any)
          .insert({
            title: file.name.replace(/\.[^.]+$/, ""),
            category: newCategory,
            tags: tagsArr,
            image_url: urlData.publicUrl,
            file_name: file.name,
            file_size: file.size,
            created_by: user?.id,
          });

        if (insertError) throw insertError;

        toast({ title: `อัปโหลด "${file.name}" สำเร็จ`, description: "เพิ่มรูป Reference แล้ว" });
      } catch (err: any) {
        toast({ title: `อัปโหลด "${file.name}" ล้มเหลว`, description: err.message, variant: "destructive" });
      }
    }

    queryClient.invalidateQueries({ queryKey: ["reference-images"] });
    setUploadingRef(false);
    setNewTags("");
    if (refImageInputRef.current) refImageInputRef.current.value = "";
  };

  const handleDelete = async (doc: KnowledgeDoc) => {
    setDeleting(doc.id);
    try {
      await supabase.storage.from("knowledge").remove([doc.file_name]);
      await (supabase.from("knowledge_documents") as any).delete().eq("id", doc.id);
      queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
      toast({ title: "ลบเอกสารแล้ว" });
    } catch {
      toast({ title: "ลบไม่สำเร็จ", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteRefImage = async (img: ReferenceImage) => {
    setDeletingRef(img.id);
    try {
      // Extract storage path from public URL
      const urlParts = img.image_url.split("/promotions/");
      if (urlParts[1]) {
        await supabase.storage.from("promotions").remove([decodeURIComponent(urlParts[1])]);
      }
      await (supabase.from("reference_images") as any).delete().eq("id", img.id);
      queryClient.invalidateQueries({ queryKey: ["reference-images"] });
      toast({ title: "ลบรูป Reference แล้ว" });
    } catch {
      toast({ title: "ลบไม่สำเร็จ", variant: "destructive" });
    } finally {
      setDeletingRef(null);
    }
  };

  // Poll for processing documents
  const hasProcessing = documents.some((d) => d.status === "processing");
  useQuery({
    queryKey: ["knowledge-documents-poll"],
    queryFn: async () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
      return null;
    },
    refetchInterval: hasProcessing ? 5000 : false,
    enabled: hasProcessing,
  });

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">คลังความรู้</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-muted/50 rounded-lg p-0.5">
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex-1 text-[11px] py-1.5 px-2 rounded-md transition-colors ${
            activeTab === "docs" ? "bg-background shadow-sm font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          📄 เอกสาร ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab("images")}
          className={`flex-1 text-[11px] py-1.5 px-2 rounded-md transition-colors ${
            activeTab === "images" ? "bg-background shadow-sm font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🖼️ รูป Reference ({refImages.length})
        </button>
      </div>

      {/* Documents Tab */}
      {activeTab === "docs" && (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-muted-foreground">
              อัปโหลด PDF, รูปภาพ, หรือไฟล์ข้อความ — AI จะอ่านและนำข้อมูลไปใช้เขียนบทความอัตโนมัติ
            </p>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                อัปโหลด
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">ยังไม่มีเอกสารในคลังความรู้</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 border border-border rounded-lg p-2.5 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {fileIcon(doc.file_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{formatSize(doc.file_size)}</span>
                        {statusBadge(doc.status)}
                        {doc.tags?.length > 0 && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {doc.tags.slice(0, 3).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDelete(doc)}
                    disabled={deleting === doc.id}
                  >
                    {deleting === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Reference Images Tab */}
      {activeTab === "images" && (
        <>
          <p className="text-[10px] text-muted-foreground mb-2">
            อัปโหลดรูปเครื่องมือแพทย์ สถานที่ หรือผลลัพธ์ — AI จะใช้เป็นต้นแบบสร้างรูปปกบทความ
          </p>

          {/* Upload controls */}
          <div className="flex flex-wrap items-end gap-2 mb-3 p-2.5 border border-dashed border-border rounded-lg bg-muted/30">
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] text-muted-foreground mb-1 block">หมวดหมู่</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full h-7 text-xs bg-background border border-border rounded px-2"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] text-muted-foreground mb-1 block">Tags (คั่นด้วย ,)</label>
              <Input
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="เช่น Doublo, HIFU"
                className="h-7 text-xs"
              />
            </div>
            <div>
              <input
                ref={refImageInputRef}
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handleUploadRefImage}
              />
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 text-xs h-7"
                onClick={() => refImageInputRef.current?.click()}
                disabled={uploadingRef}
              >
                {uploadingRef ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                เพิ่มรูป
              </Button>
            </div>
          </div>

          {refLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : refImages.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ImagePlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">ยังไม่มีรูป Reference</p>
              <p className="text-[10px] mt-1">อัปโหลดรูปเครื่องมือแพทย์ หน้าคลินิก หรือผลลัพธ์</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {refImages.map((img) => (
                <div
                  key={img.id}
                  className="relative group border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <img
                    src={img.image_url}
                    alt={img.title}
                    className="w-full h-24 object-cover"
                    loading="lazy"
                  />
                  <div className="p-1.5">
                    <p className="text-[10px] font-medium text-foreground truncate">{img.title}</p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                        {CATEGORY_OPTIONS.find(c => c.value === img.category)?.label || img.category}
                      </Badge>
                      {img.tags?.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-[9px] text-muted-foreground">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteRefImage(img)}
                    disabled={deletingRef === img.id}
                  >
                    {deletingRef === img.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KnowledgeVault;
