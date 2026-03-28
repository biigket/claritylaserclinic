import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import CanvasInputForm, { type CanvasInput } from "@/components/admin/canvas/CanvasInputForm";
import CanvasZoneDisplay, { type CanvasData } from "@/components/admin/canvas/CanvasZoneDisplay";

const CANVAS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-canvas-generate`;

function tryParseCanvasJson(text: string): CanvasData | null {
  // Strip markdown code block if present
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.zone1 || parsed.zone2 || parsed.zone3 || parsed.zone4) return parsed;
  } catch {
    // Try to extract JSON object
    const match = cleaned.match(/\{[\s\S]*"zone[1234]"[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch { /* ignore */ }
    }
  }
  return null;
}

const ContentCanvas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingZone, setRegeneratingZone] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentInput, setCurrentInput] = useState<CanvasInput | null>(null);

  const streamGenerate = useCallback(async (input: CanvasInput, zone?: number) => {
    if (zone) {
      setRegeneratingZone(zone);
    } else {
      setIsGenerating(true);
      setProgress(0);
    }

    let fullText = "";

    try {
      const resp = await fetch(CANVAS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ ...input, zone: zone || undefined }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              chunkCount++;
              if (!zone) {
                setProgress(Math.min(95, Math.round(chunkCount * 0.5)));
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Parse the completed response
      const parsed = tryParseCanvasJson(fullText);
      if (parsed) {
        if (zone) {
          // Merge single zone
          const zoneKey = `zone${zone}` as keyof CanvasData;
          setCanvasData((prev) => prev ? { ...prev, [zoneKey]: (parsed as any)[zoneKey] || (parsed as any) } : parsed);
        } else {
          setCanvasData(parsed);
        }
        if (!zone) setProgress(100);
        toast({ title: zone ? `Zone ${zone} regenerated ✨` : "Content Canvas สร้างเสร็จแล้ว ✨" });
      } else {
        console.warn("Could not parse canvas JSON:", fullText.slice(0, 500));
        toast({ title: "ไม่สามารถ parse ผลลัพธ์ได้", description: "กรุณาลองใหม่อีกครั้ง", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setRegeneratingZone(null);
    }
  }, [toast]);

  const handleGenerate = (input: CanvasInput) => {
    setCurrentInput(input);
    streamGenerate(input);
  };

  const handleRegenerate = (zone: number) => {
    if (currentInput) {
      streamGenerate(currentInput, zone);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/blogs")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-display text-xl text-foreground">AI-FIRST Content Canvas</h1>
          <p className="text-[10px] text-muted-foreground">สร้างเนื้อหาสำหรับ AI Search & Answer Engines</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <CanvasInputForm onGenerate={handleGenerate} isGenerating={isGenerating} />
      </div>

      {/* Progress */}
      {isGenerating && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              กำลังสร้าง Content Canvas...
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>🔵 Zone 1</span>
            <span>🟢 Zone 2</span>
            <span>🟡 Zone 3</span>
            <span>🔴 Zone 4</span>
          </div>
        </div>
      )}

      {/* Output */}
      {canvasData && (
        <CanvasZoneDisplay
          data={canvasData}
          onRegenerate={handleRegenerate}
          regeneratingZone={regeneratingZone}
        />
      )}
    </div>
  );
};

export default ContentCanvas;
