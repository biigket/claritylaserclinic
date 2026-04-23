import { useMemo } from "react";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const formatInline = (text: string) =>
  escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-foreground/70">$1</em>')
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (_, alt, src) =>
        `<img src="${src}" alt="${alt}" loading="lazy" class="my-4 rounded-xl max-w-full h-auto block" />`
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer" class="text-primary underline underline-offset-2">$1</a>'
    );

const renderMarkdown = (md: string): string => {
  const blocks = md.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^###\s+/.test(trimmed))
        return `<h3 class="font-display text-base text-foreground mt-6 mb-2">${formatInline(trimmed.replace(/^###\s+/, ""))}</h3>`;
      if (/^##\s+/.test(trimmed))
        return `<h2 class="font-display text-lg text-foreground mt-8 mb-3">${formatInline(trimmed.replace(/^##\s+/, ""))}</h2>`;
      if (/^#\s+/.test(trimmed))
        return `<h1 class="font-display text-xl text-foreground mt-8 mb-3">${formatInline(trimmed.replace(/^#\s+/, ""))}</h1>`;
      if (/^>\s+/.test(trimmed))
        return `<blockquote class="border-l-2 border-primary/40 pl-3 italic text-foreground/70 my-3">${formatInline(trimmed.replace(/^>\s+/, ""))}</blockquote>`;
      if (/^[-*]\s+/.test(trimmed)) {
        const items = trimmed
          .split("\n")
          .filter((l) => /^[-*]\s+/.test(l))
          .map((l) => `<li>${formatInline(l.replace(/^[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul class="list-disc pl-5 space-y-1 my-3 text-foreground/80">${items}</ul>`;
      }
      if (/^\d+\.\s+/.test(trimmed)) {
        const items = trimmed
          .split("\n")
          .filter((l) => /^\d+\.\s+/.test(l))
          .map((l) => `<li>${formatInline(l.replace(/^\d+\.\s+/, ""))}</li>`)
          .join("");
        return `<ol class="list-decimal pl-5 space-y-1 my-3 text-foreground/80">${items}</ol>`;
      }
      // Standalone image paragraph -> render directly
      if (/^!\[[^\]]*\]\([^)]+\)\s*$/.test(trimmed)) {
        return formatInline(trimmed);
      }
      return `<p class="text-foreground/80 leading-relaxed my-3">${formatInline(trimmed)}</p>`;
    })
    .join("\n");
};

export const MarkdownPreview = ({ content }: { content: string }) => {
  const html = useMemo(() => renderMarkdown(content || ""), [content]);
  if (!content?.trim()) {
    return (
      <div className="text-xs text-muted-foreground italic p-4 border border-dashed border-border rounded-lg">
        ยังไม่มีเนื้อหา
      </div>
    );
  }
  return (
    <article
      className="prose-sm max-w-none text-sm"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPreview;