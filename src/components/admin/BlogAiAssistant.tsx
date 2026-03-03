import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles, Send, Copy, Check, Loader2, Trash2, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

export type BlogInsertData = {
  title_th?: string;
  title_en?: string;
  excerpt_th?: string;
  excerpt_en?: string;
  content_th?: string;
  content_en?: string;
  meta_title_th?: string;
  meta_title_en?: string;
  meta_description_th?: string;
  meta_description_en?: string;
  tags?: string[];
  slug?: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-ai-assistant`;

const QUICK_PROMPTS = [
  { label: "เขียนบทความ", prompt: "ช่วยเขียนบทความเรื่อง [หัวข้อ] ความยาวประมาณ 800 คำ เน้น Local SEO ราชเทวี พญาไท สยาม เป็นทั้งภาษาไทยและอังกฤษ" },
  { label: "หลุมสิว", prompt: "ช่วยเขียนบทความเรื่องการรักษาหลุมสิวด้วยเลเซอร์ที่ Clarity Laser Clinic ย่านราชเทวี ทั้งภาษาไทยและอังกฤษ" },
  { label: "งานผิว", prompt: "ช่วยเขียนบทความเรื่องงานผิวและการดูแลผิวหน้าอย่างมืออาชีพที่ Clarity Laser Clinic ใกล้ BTS พญาไท ทั้งภาษาไทยและอังกฤษ" },
  { label: "ยกกระชับ", prompt: "ช่วยเขียนบทความเรื่องการยกกระชับผิวหน้าด้วยเทคโนโลยีเลเซอร์ที่ Clarity Laser Clinic ย่านสยาม ทั้งภาษาไทยและอังกฤษ" },
];

interface BlogAiAssistantProps {
  onInsert?: (data: BlogInsertData) => void;
  context?: string;
}

function tryParseArticleJson(text: string): BlogInsertData | null {
  try {
    // Try direct parse
    const parsed = JSON.parse(text);
    if (parsed.content_th || parsed.title_th) return parsed;
  } catch {
    // Try to extract JSON from text
    const match = text.match(/\{[\s\S]*"content_th"[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch { /* ignore */ }
    }
  }
  return null;
}

const BlogAiAssistant = ({ onInsert, context }: BlogAiAssistantProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

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
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleInsert = (text: string) => {
    const parsed = tryParseArticleJson(text);
    if (parsed && onInsert) {
      onInsert(parsed);
      toast({ title: "วางเนื้อหาทุกช่องแล้ว", description: "ตรวจสอบทั้ง TH และ EN ก่อนบันทึก" });
    } else if (onInsert) {
      // Fallback: insert as content_th only
      onInsert({ content_th: text });
      toast({ title: "วางเนื้อหา (TH) แล้ว" });
    }
  };

  const getDisplayContent = (text: string) => {
    const parsed = tryParseArticleJson(text);
    if (!parsed) return text;
    
    const parts: string[] = [];
    if (parsed.title_th) parts.push(`## 🇹🇭 ${parsed.title_th}`);
    if (parsed.excerpt_th) parts.push(`> ${parsed.excerpt_th}`);
    if (parsed.title_en) parts.push(`## 🇬🇧 ${parsed.title_en}`);
    if (parsed.excerpt_en) parts.push(`> ${parsed.excerpt_en}`);
    if (parsed.content_th) parts.push(`\n---\n**เนื้อหา TH:** ${parsed.content_th.slice(0, 200)}...`);
    if (parsed.content_en) parts.push(`**เนื้อหา EN:** ${parsed.content_en.slice(0, 200)}...`);
    if (parsed.tags?.length) parts.push(`\n🏷️ Tags: ${parsed.tags.join(", ")}`);
    if (parsed.slug) parts.push(`🔗 Slug: ${parsed.slug}`);
    return parts.join("\n\n");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5">
          <Sparkles className="w-3.5 h-3.5" />
          AI ช่วยเขียน
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI ช่วยเขียน (TH + EN)
            </SheetTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7 px-2"
                onClick={() => setMessages([])}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                ล้าง
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center py-4">
                สวัสดีค่ะ! ฉันช่วยเขียนบทความ 2 ภาษา (TH + EN) พร้อม SEO<br/>
                เน้น Local SEO: ราชเทวี, พญาไท, สยาม
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => setInput(qp.prompt)}
                    className="text-left p-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors"
                  >
                    <span className="text-xs font-medium text-foreground">{qp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <div className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                  {msg.role === "assistant" ? getDisplayContent(msg.content) : msg.content}
                </div>
                {msg.role === "assistant" && !isLoading && (
                  <div className="flex gap-1 mt-2 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-muted-foreground"
                      onClick={() => handleCopy(msg.content, i)}
                    >
                      {copiedIdx === i ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copiedIdx === i ? "คัดลอกแล้ว" : "คัดลอก"}
                    </Button>
                    {onInsert && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-primary font-medium"
                        onClick={() => handleInsert(msg.content)}
                      >
                        <FileDown className="w-3 h-3 mr-1" />
                        วางลงทุกช่อง
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="พิมพ์หัวข้อ เช่น 'เขียนบทความเรื่องหลุมสิว'..."
              rows={2}
              className="text-sm resize-none flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BlogAiAssistant;
