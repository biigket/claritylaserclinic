import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Helper until types regenerate
const promoTable = () => supabase.from("promotions") as any;
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Edit, Copy, Trash2, Eye, EyeOff, Archive,
  GripVertical, Image as ImageIcon
} from "lucide-react";
import {
  DragDropContext, Droppable, Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

type Promotion = {
  id: string;
  slug: string;
  status: string;
  is_featured: boolean;
  order_index: number;
  title_th: string | null;
  title_en: string | null;
  price: number | null;
  cover_image_url: string | null;
  start_at: string | null;
  end_at: string | null;
  updated_at: string;
  updated_by: string | null;
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-100 text-green-700",
  archived: "bg-orange-100 text-orange-700",
};

const PromotionsList = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await promoTable()
        .select("id, slug, status, is_featured, order_index, title_th, title_en, price, cover_image_url, start_at, end_at, updated_at, updated_by")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Promotion[];
    },
  });

  const isExpired = (p: Promotion) => p.end_at && new Date(p.end_at) < new Date();

  const filtered = promotions.filter((p) => {
    const matchSearch =
      !search ||
      p.title_th?.toLowerCase().includes(search.toLowerCase()) ||
      p.title_en?.toLowerCase().includes(search.toLowerCase()) ||
      p.slug?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "expired" ? isExpired(p) : p.status === statusFilter);

    return matchSearch && matchStatus;
  });

  const updateOrder = useMutation({
    mutationFn: async (items: { id: string; order_index: number }[]) => {
      for (const item of items) {
        await promoTable().update({ order_index: item.order_index }).eq("id", item.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-promotions"] }),
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(filtered);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    const updates = items.map((item, i) => ({ id: item.id, order_index: i }));
    updateOrder.mutate(updates);
  };

  const handleDuplicate = async (p: Promotion) => {
    const { data: original } = await promoTable().select("*").eq("id", p.id).single();
    if (!original) return;
    const { id, created_at, updated_at, slug, ...rest } = original;
    const { data: { user } } = await supabase.auth.getUser();
    await promoTable().insert({
      ...rest,
      slug: `${slug}-copy-${Date.now()}`,
      status: "draft",
      created_by: user?.id,
      updated_by: user?.id,
    });
    queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    toast({ title: "ทำสำเนาสำเร็จ" });
  };

  const handleTogglePublish = async (p: Promotion) => {
    const newStatus = p.status === "published" ? "draft" : "published";
    if (newStatus === "published") {
      if (!p.cover_image_url || (!p.title_th && !p.title_en) || p.price == null) {
        toast({ title: "ไม่สามารถเผยแพร่ได้", description: "ต้องมีรูปปก, ชื่อ, และราคา", variant: "destructive" });
        return;
      }
    }
    const { data: { user } } = await supabase.auth.getUser();
    await promoTable().update({ status: newStatus, updated_by: user?.id }).eq("id", p.id);
    queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    toast({ title: newStatus === "published" ? "เผยแพร่แล้ว" : "ยกเลิกเผยแพร่แล้ว" });
  };

  const handleArchive = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await promoTable().update({ status: "archived", updated_by: user?.id }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    toast({ title: "จัดเก็บแล้ว" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบ? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;
    await promoTable().delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    toast({ title: "ลบสำเร็จ" });
  };

  const statuses = ["all", "draft", "published", "archived", "expired"];

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl text-foreground">โปรโมชั่น</h1>
          <p className="text-xs text-muted-foreground mt-1">จัดการ Promotion Cards บนเว็บไซต์</p>
        </div>
        <Button onClick={() => navigate("/admin/promotions/new")} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          สร้างใหม่
        </Button>
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
              className="text-xs capitalize"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "ทั้งหมด" : s === "draft" ? "ร่าง" : s === "published" ? "เผยแพร่" : s === "archived" ? "จัดเก็บ" : "หมดอายุ"}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm">ไม่พบโปรโมชั่น</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="promotions">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {filtered.map((p, index) => (
                  <Draggable key={p.id} draggableId={p.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`group bg-card border border-border rounded-xl p-3 flex items-center gap-3 transition-shadow ${
                          snapshot.isDragging ? "shadow-lg" : ""
                        }`}
                      >
                        <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {p.cover_image_url ? (
                            <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {p.title_th || p.title_en || "ไม่มีชื่อ"}
                            </p>
                            {p.is_featured && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Featured</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[p.status] || ""}`}>
                              {isExpired(p) ? "หมดอายุ" : p.status === "draft" ? "ร่าง" : p.status === "published" ? "เผยแพร่" : "จัดเก็บ"}
                            </Badge>
                            {p.price != null && <span className="text-xs text-muted-foreground">฿{p.price.toLocaleString()}</span>}
                            <span className="text-[10px] text-muted-foreground">/{p.slug}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/promotions/${p.id}`)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(p)}>
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTogglePublish(p)}>
                                {p.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleArchive(p.id)}>
                                <Archive className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};

export default PromotionsList;
