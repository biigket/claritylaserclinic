import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, Clock, Play, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const SCHEDULE_OPTIONS = [
  { value: "*/30 * * * *", label: "ทุก 30 นาที" },
  { value: "0 * * * *", label: "ทุก 1 ชั่วโมง" },
  { value: "0 */3 * * *", label: "ทุก 3 ชั่วโมง" },
  { value: "0 */6 * * *", label: "ทุก 6 ชั่วโมง" },
  { value: "0 */12 * * *", label: "ทุก 12 ชั่วโมง" },
  { value: "0 0 * * *", label: "วันละ 1 ครั้ง (เที่ยงคืน)" },
  { value: "0 8 * * *", label: "วันละ 1 ครั้ง (08:00)" },
];

const BATCH_OPTIONS = [
  { value: "1", label: "1 บทความ" },
  { value: "2", label: "2 บทความ" },
  { value: "3", label: "3 บทความ" },
  { value: "5", label: "5 บทความ" },
];

const AUTO_PUBLISH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-publish-articles`;

const AutoPublishSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runningNow, setRunningNow] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [cronExpression, setCronExpression] = useState("0 */6 * * *");
  const [batchSize, setBatchSize] = useState("3");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["auto-publish-settings"],
    queryFn: async () => {
      const { data } = await (supabase.from("auto_publish_settings") as any)
        .select("*")
        .eq("id", "default")
        .single();
      return data;
    },
  });

  const { data: pendingCount } = useQuery({
    queryKey: ["pending-topic-count"],
    queryFn: async () => {
      const { count } = await (supabase.from("content_topic_backlog") as any)
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      return count || 0;
    },
  });

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setCronExpression(settings.cron_expression);
      setBatchSize(String(settings.batch_size));
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase.from("auto_publish_settings") as any)
        .update({
          enabled,
          cron_expression: cronExpression,
          batch_size: parseInt(batchSize),
          updated_at: new Date().toISOString(),
        })
        .eq("id", "default");

      if (error) throw error;

      // Update cron schedule in database
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await supabase.rpc("update_auto_publish_cron" as any, {
        _cron_expression: cronExpression,
        _supabase_url: supabaseUrl,
        _anon_key: anonKey,
      });

      toast({ title: "บันทึกการตั้งค่าแล้ว ✅" });
    } catch (e: any) {
      toast({ title: "บันทึกล้มเหลว", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunningNow(true);
    try {
      const resp = await fetch(AUTO_PUBLISH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ batch_size: parseInt(batchSize) }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);

      queryClient.invalidateQueries({ queryKey: ["content-topic-backlog"] });
      queryClient.invalidateQueries({ queryKey: ["pending-topic-count"] });

      toast({
        title: data.message || "เสร็จแล้ว",
        description: data.results?.length
          ? `สร้างแล้ว: ${data.results.map((r: any) => r.topic).join(", ")}`
          : undefined,
      });
    } catch (e: any) {
      toast({ title: "รันล้มเหลว", description: e.message, variant: "destructive" });
    } finally {
      setRunningNow(false);
    }
  };

  const scheduleLabel = SCHEDULE_OPTIONS.find((s) => s.value === cronExpression)?.label || cronExpression;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Auto-Publish</span>
          {enabled ? (
            <Badge className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-700 border-green-500/30">
              เปิดอยู่ — {scheduleLabel}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">ปิดอยู่</Badge>
          )}
          {pendingCount ? (
            <span className="text-[10px] text-muted-foreground">
              ({pendingCount} หัวข้อรอ)
            </span>
          ) : null}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-foreground">เปิดใช้ Auto-Publish</Label>
              <p className="text-[10px] text-muted-foreground">ระบบจะสร้างและเผยแพร่บทความจากหัวข้อรอเขียนอัตโนมัติ</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">ความถี่</Label>
              <Select value={cronExpression} onValueChange={setCronExpression}>
                <SelectTrigger className="text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCHEDULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">จำนวนต่อรอบ</Label>
              <Select value={batchSize} onValueChange={setBatchSize}>
                <SelectTrigger className="text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BATCH_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" className="gap-1.5 text-xs" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Settings2 className="w-3.5 h-3.5" />}
              บันทึกตั้งค่า
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5"
              onClick={handleRunNow}
              disabled={runningNow || !pendingCount}
            >
              {runningNow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {runningNow ? "กำลังสร้าง..." : "รันตอนนี้เลย"}
            </Button>
          </div>

          {runningNow && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              กำลังสร้างและเผยแพร่บทความ อาจใช้เวลา 1-3 นาทีต่อบทความ...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoPublishSettings;
