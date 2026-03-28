import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Upload, Trash2, Loader2, FileText, Image, File, CheckCircle, AlertCircle } from "lucide-react";

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

const KnowledgeVault = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery<KnowledgeDoc[]>({
    queryKey: ["knowledge-documents"],
    queryFn: async () => {
      const { data } = await (supabase.from("knowledge_documents") as any)
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as KnowledgeDoc[];
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();

    for (const file of Array.from(files)) {
      try {
        // Upload to storage
        const filePath = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("knowledge")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create document record
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

        // Trigger text extraction
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
          // Refresh after extraction completes
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

  const handleDelete = async (doc: KnowledgeDoc) => {
    setDeleting(doc.id);
    try {
      // Delete from storage
      await supabase.storage.from("knowledge").remove([doc.file_name]);
      // Delete record
      await (supabase.from("knowledge_documents") as any).delete().eq("id", doc.id);
      queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
      toast({ title: "ลบเอกสารแล้ว" });
    } catch {
      toast({ title: "ลบไม่สำเร็จ", variant: "destructive" });
    } finally {
      setDeleting(null);
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
          <span className="text-[10px] text-muted-foreground">({documents.length} ไฟล์)</span>
        </div>
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
            อัปโหลดไฟล์
          </Button>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mb-3">
        อัปโหลด PDF, รูปภาพ, หรือไฟล์ข้อความ — AI จะอ่านและนำข้อมูลไปใช้เขียนบทความอัตโนมัติ
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">ยังไม่มีเอกสารในคลังความรู้</p>
          <p className="text-[10px] mt-1">อัปโหลดไฟล์เพื่อให้ AI ใช้เป็นข้อมูลอ้างอิง</p>
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
    </div>
  );
};

export default KnowledgeVault;
