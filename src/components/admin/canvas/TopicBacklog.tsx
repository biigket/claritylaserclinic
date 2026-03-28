import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, PenLine, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TopicItem {
  id: string;
  title_th: string;
  title_en: string | null;
  description_th: string | null;
  description_en: string | null;
  suggested_slug: string | null;
  source_article_title: string | null;
  status: string;
  created_at: string;
}

interface Props {
  topics: TopicItem[];
  onWrite: (topic: TopicItem) => void;
  onDelete: (id: string) => void;
  isDeleting: string | null;
  isCollapsed?: boolean;
}

const TopicBacklog = ({ topics, onWrite, onDelete, isDeleting }: Props) => {
  const [expanded, setExpanded] = useState(true);
  const pendingTopics = topics.filter((t) => t.status === "pending");

  if (pendingTopics.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            หัวข้อรอเขียน
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {pendingTopics.length}
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Topic List */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {pendingTopics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">
                  → {topic.title_th}
                </p>
                {topic.title_en && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {topic.title_en}
                  </p>
                )}
                {topic.description_th && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {topic.description_th}
                  </p>
                )}
                {topic.source_article_title && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    จากบทความ: {topic.source_article_title}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-[11px] h-7 border-primary/30 text-primary hover:bg-primary/5"
                  onClick={() => onWrite(topic)}
                >
                  <PenLine className="w-3 h-3" />
                  เขียน
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete(topic.id)}
                  disabled={isDeleting === topic.id}
                >
                  {isDeleting === topic.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicBacklog;
