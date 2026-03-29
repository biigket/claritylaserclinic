import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Edit, Trash2, Eye, EyeOff, FileText, Pin, PinOff,
} from "lucide-react";
import BulkArticleGenerator from "@/components/admin/BulkArticleGenerator";

const blogTable = () => supabase.from("blog_articles") as any;

type Article = {
  id: string;
  slug: string;
  status: string;
  title_th: string;
  title_en: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  view_count: number;
  published_at: string | null;
  updated_at: string;
  is_pinned: boolean;
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-100 text-green-700",
};

const BlogsList = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: async () => {
      const { data, error } = await blogTable()
        .select("id, slug, status, title_th, title_en, cover_image_url, tags, view_count, published_at, updated_at, is_pinned")
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Article[];
    },
  });

  // Collect all unique tags
  const allTags = Array.from(
    new Set(articles.flatMap((a) => a.tags || []))
  ).sort();

  const filtered = articles.filter((a) => {
    const matchSearch =
      !search ||
      a.title_th?.toLowerCase().includes(search.toLowerCase()) ||
      a.title_en?.toLowerCase().includes(search.toLowerCase()) ||
      a.slug?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchTag = selectedTag === "all" || (a.tags || []).includes(selectedTag);
    return matchSearch && matchStatus && matchTag;
  });

  const totalCount = articles.length;
  const publishedCount = articles.filter((a) => a.status === "published").length;
  const draftCount = articles.filter((a) => a.status === "draft").length;

  const handleTogglePublish = async (a: Article) => {
    const newStatus = a.status === "published" ? "draft" : "published";
    if (newStatus === "published" && !a.title_th) {
      toast({ title: "ต้องมีชื่อบทความ (TH)", variant: "destructive" });
      return;
    }
    await blogTable().update({
      status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : null,
    }).eq("id", a.id);
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    toast({ title: newStatus === "published" ? "เผยแพร่แล้ว" : "ยกเลิกเผยแพร่แล้ว" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบบทความนี้?")) return;
    await blogTable().delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    toast({ title: "ลบสำเร็จ" });
  };

  const handleTogglePin = async (a: Article) => {
    await blogTable().update({ is_pinned: !a.is_pinned }).eq("id", a.id);
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    toast({ title: a.is_pinned ? "ยกเลิกปักหมุดแล้ว" : "ปักหมุดเป็นต้นแบบ AI แล้ว" });
  };

  const statuses = ["all", "draft", "published"];

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl text-foreground">บทความ</h1>
          <p className="text-xs text-muted-foreground mt-1">จัดการ Blog Articles สำหรับ SEO</p>
        </div>
        <div className="flex gap-2">
          <BulkArticleGenerator />
          <Button onClick={() => navigate("/admin/blogs/new")} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            เขียนบทความใหม่
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ / slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "ทั้งหมด" : s === "draft" ? "ร่าง" : "เผยแพร่"}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm">ไม่พบบทความ</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div
              key={a.id}
              className={`group border rounded-xl p-3 flex items-center gap-3 transition-shadow hover:shadow-sm ${a.is_pinned ? "bg-primary/5 border-primary/30" : "bg-card border-border"}`}
            >
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {a.cover_image_url ? (
                  <img src={a.cover_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                  {a.is_pinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0" />}
                  {a.title_th || a.title_en || "ไม่มีชื่อ"}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[a.status] || ""}`}>
                    {a.status === "draft" ? "ร่าง" : "เผยแพร่"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">/{a.slug}</span>
                  <span className="text-[10px] text-muted-foreground">👁 {a.view_count}</span>
                  {a.tags?.slice(0, 2).map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" title={a.is_pinned ? "ยกเลิกปักหมุด" : "ปักหมุดเป็นต้นแบบ AI"} onClick={() => handleTogglePin(a)}>
                  {a.is_pinned ? <PinOff className="w-3.5 h-3.5 text-primary" /> : <Pin className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/blogs/${a.id}`)}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                {isAdmin && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTogglePublish(a)}>
                      {a.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogsList;
